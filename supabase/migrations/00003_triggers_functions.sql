-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tasks_updated_at    BEFORE UPDATE ON tasks    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── AUTO-CREATE PROFILE ON SIGNUP ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role, lang)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'field_technician'),
    COALESCE(NEW.raw_user_meta_data->>'lang', 'ar')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── JWT CUSTOM CLAIMS ────────────────────────────────────────────────────────
-- Called by Supabase Auth hook to embed role + team_id + can_see_prices in JWT
CREATE OR REPLACE FUNCTION custom_access_token_hook(event JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  claims     JSONB;
  user_rec   RECORD;
BEGIN
  SELECT role, team_id, can_see_prices
  INTO user_rec
  FROM profiles
  WHERE id = (event->>'user_id')::UUID;

  claims := event->'claims';
  claims := jsonb_set(claims, '{user_role}',       to_jsonb(user_rec.role::TEXT));
  claims := jsonb_set(claims, '{team_id}',          to_jsonb(user_rec.team_id::TEXT));
  claims := jsonb_set(claims, '{can_see_prices}',   to_jsonb(user_rec.can_see_prices));

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- ─── TASK APPROVAL TRIGGER ────────────────────────────────────────────────────
-- When a task moves to 'approved', set submitted_at if missing + fire Realtime notification
CREATE OR REPLACE FUNCTION on_task_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Set submitted_at when first moving out of draft/pending
  IF NEW.status IN ('approved', 'rejected') AND OLD.status IN ('draft', 'pending') THEN
    NEW.reviewed_at := NOW();
  END IF;

  -- Log to audit
  INSERT INTO audit_log (table_name, record_id, operation, old_data, new_data, performed_by)
  VALUES (
    'tasks',
    NEW.id,
    'UPDATE',
    jsonb_build_object('status', OLD.status),
    jsonb_build_object('status', NEW.status, 'reviewed_by', NEW.reviewed_by),
    auth.uid()
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER task_status_change
  BEFORE UPDATE OF status ON tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION on_task_status_change();

-- ─── DASHBOARD KPIs FUNCTION ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_dashboard_kpis(p_project_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_tasks          BIGINT,
  approved_tasks       BIGINT,
  completion_pct       NUMERIC,
  total_route_meters   NUMERIC,
  total_nodes          BIGINT,
  approved_line_total  NUMERIC,
  pending_count        BIGINT
)
LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT
    COUNT(*)                                                                   AS total_tasks,
    COUNT(*) FILTER (WHERE status = 'approved')                               AS approved_tasks,
    ROUND(
      COUNT(*) FILTER (WHERE status IN ('approved','invoiced'))::NUMERIC
      / NULLIF(COUNT(*), 0) * 100,
      1
    )                                                                          AS completion_pct,
    COALESCE(SUM(route_length_m) FILTER (WHERE task_type = 'route'), 0)       AS total_route_meters,
    COUNT(*) FILTER (WHERE task_type = 'node')                                AS total_nodes,
    COALESCE(SUM(line_total) FILTER (WHERE status IN ('approved','invoiced')), 0) AS approved_line_total,
    COUNT(*) FILTER (WHERE status = 'pending')                                AS pending_count
  FROM tasks
  WHERE (p_project_id IS NULL OR project_id = p_project_id);
$$;

-- ─── INVOICE GENERATION FUNCTION ─────────────────────────────────────────────
-- Aggregates approved tasks into invoice_lines grouped by BOQ code
CREATE OR REPLACE FUNCTION generate_invoice_lines(p_invoice_id UUID, p_site_id UUID, p_start DATE, p_end DATE)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Delete existing lines for this invoice
  DELETE FROM invoice_lines WHERE invoice_id = p_invoice_id;

  -- Aggregate tasks by contract_item
  INSERT INTO invoice_lines (invoice_id, contract_item_id, quantity, unit_price, task_count)
  SELECT
    p_invoice_id,
    contract_item_id,
    SUM(CASE
      WHEN task_type = 'route' THEN route_length_m
      WHEN task_type = 'node'  THEN quantity
      ELSE 0
    END),
    MAX(unit_price),
    COUNT(*)
  FROM tasks
  WHERE
    site_id = p_site_id
    AND task_date BETWEEN p_start AND p_end
    AND status = 'approved'
    AND invoice_id IS NULL
    AND contract_item_id IS NOT NULL
  GROUP BY contract_item_id;

  -- Update invoice subtotal
  UPDATE invoices
  SET subtotal = (SELECT COALESCE(SUM(line_total), 0) FROM invoice_lines WHERE invoice_id = p_invoice_id)
  WHERE id = p_invoice_id;

  -- Mark tasks as invoiced
  UPDATE tasks
  SET invoice_id = p_invoice_id, status = 'invoiced'
  WHERE
    site_id = p_site_id
    AND task_date BETWEEN p_start AND p_end
    AND status = 'approved'
    AND invoice_id IS NULL;
END;
$$;

-- ─── MOBILE SYNC FUNCTION ────────────────────────────────────────────────────
-- Returns tasks + reference data changed since last_pulled_at for WatermelonDB pull
CREATE OR REPLACE FUNCTION get_sync_changes(
  p_last_pulled_at TIMESTAMPTZ,
  p_user_id UUID
)
RETURNS JSONB LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  WITH user_team AS (
    SELECT team_id, project_id FROM profiles p
    LEFT JOIN teams t ON t.id = p.team_id
    WHERE p.id = p_user_id
  )
  SELECT jsonb_build_object(
    'tasks', jsonb_build_object(
      'created', COALESCE((
        SELECT jsonb_agg(row_to_json(t))
        FROM tasks t, user_team ut
        WHERE t.team_id = ut.team_id
          AND t.created_at > COALESCE(p_last_pulled_at, 'epoch')
      ), '[]'::jsonb),
      'updated', COALESCE((
        SELECT jsonb_agg(row_to_json(t))
        FROM tasks t, user_team ut
        WHERE t.team_id = ut.team_id
          AND t.updated_at > COALESCE(p_last_pulled_at, 'epoch')
          AND t.created_at <= COALESCE(p_last_pulled_at, 'epoch')
      ), '[]'::jsonb),
      'deleted', '[]'::jsonb
    ),
    'contract_items', jsonb_build_object(
      'created', COALESCE((
        SELECT jsonb_agg(row_to_json(ci))
        FROM contract_items ci
        JOIN contract_groups cg ON cg.id = ci.group_id
        JOIN user_team ut ON cg.project_id = ut.project_id
        WHERE TRUE  -- contract items don't have updated_at; pull all on first sync
      ), '[]'::jsonb),
      'updated', '[]'::jsonb,
      'deleted', '[]'::jsonb
    ),
    'cabinets', jsonb_build_object(
      'created', COALESCE((
        SELECT jsonb_agg(row_to_json(c))
        FROM cabinets c
        JOIN sites s ON s.id = c.site_id
        JOIN user_team ut ON s.project_id = ut.project_id
      ), '[]'::jsonb),
      'updated', '[]'::jsonb,
      'deleted', '[]'::jsonb
    )
  )
$$;
