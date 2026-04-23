-- Enable RLS on all tables
ALTER TABLE projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites           ENABLE ROW LEVEL SECURITY;
ALTER TABLE cabinets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE boxes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams           ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_photos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines   ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log       ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role from JWT custom claims
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'user_role',
    (SELECT role::TEXT FROM profiles WHERE id = auth.uid())
  )
$$;

-- Helper: get current user's team_id
CREATE OR REPLACE FUNCTION current_team_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT team_id FROM profiles WHERE id = auth.uid()
$$;

-- Helper: can current user see prices?
CREATE OR REPLACE FUNCTION current_can_see_prices()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'can_see_prices')::BOOLEAN,
    (SELECT can_see_prices FROM profiles WHERE id = auth.uid()),
    FALSE
  )
$$;

-- ─── PROFILES ─────────────────────────────────────────────────────────────────
-- Users can always read their own profile
CREATE POLICY "profiles_own_read" ON profiles FOR SELECT
  USING (id = auth.uid());

-- Admins and PMs can read all profiles
CREATE POLICY "profiles_admin_pm_read" ON profiles FOR SELECT
  USING (current_user_role() IN ('admin', 'project_manager'));

-- Users can update their own profile (lang, phone only — role managed by admin)
CREATE POLICY "profiles_own_update" ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- Admin can update any profile
CREATE POLICY "profiles_admin_update" ON profiles FOR ALL
  USING (current_user_role() = 'admin');

-- ─── PROJECTS ─────────────────────────────────────────────────────────────────
-- All authenticated users can read projects
CREATE POLICY "projects_authenticated_read" ON projects FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admin only can insert/update/delete
CREATE POLICY "projects_admin_write" ON projects FOR ALL
  USING (current_user_role() = 'admin');

-- ─── SITES, CABINETS, BOXES ───────────────────────────────────────────────────
-- All authenticated users can read reference data
CREATE POLICY "sites_authenticated_read" ON sites FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "cabinets_authenticated_read" ON cabinets FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "boxes_authenticated_read" ON boxes FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admin/PM can write
CREATE POLICY "sites_admin_pm_write" ON sites FOR ALL
  USING (current_user_role() IN ('admin', 'project_manager'));

CREATE POLICY "cabinets_admin_pm_write" ON cabinets FOR ALL
  USING (current_user_role() IN ('admin', 'project_manager'));

CREATE POLICY "boxes_admin_pm_write" ON boxes FOR ALL
  USING (current_user_role() IN ('admin', 'project_manager'));

-- ─── TEAMS ────────────────────────────────────────────────────────────────────
CREATE POLICY "teams_authenticated_read" ON teams FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "teams_admin_pm_write" ON teams FOR ALL
  USING (current_user_role() IN ('admin', 'project_manager'));

-- ─── CONTRACT (read-only for technicians via safe view) ───────────────────────
CREATE POLICY "contract_groups_authenticated_read" ON contract_groups FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "contract_items_authenticated_read" ON contract_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "contract_admin_pm_write" ON contract_items FOR ALL
  USING (current_user_role() IN ('admin', 'project_manager'));

-- Safe view: hides unit_price for field_technician role
CREATE OR REPLACE VIEW contract_items_safe WITH (security_invoker = true) AS
  SELECT
    ci.id,
    ci.group_id,
    ci.code,
    ci.description_ar,
    ci.description_en,
    ci.unit,
    ci.task_type,
    ci.contract_qty,
    ci.sort_order,
    cg.code AS group_code,
    cg.name_ar AS group_name_ar,
    cg.name_en AS group_name_en,
    CASE
      WHEN current_can_see_prices() THEN ci.unit_price
      ELSE NULL
    END AS unit_price
  FROM contract_items ci
  JOIN contract_groups cg ON cg.id = ci.group_id;

-- ─── TASKS ────────────────────────────────────────────────────────────────────
-- Field technician: own team's tasks only
CREATE POLICY "tasks_technician_read" ON tasks FOR SELECT
  USING (
    current_user_role() = 'field_technician'
    AND team_id = current_team_id()
  );

-- Field supervisor: own team's tasks
CREATE POLICY "tasks_supervisor_read" ON tasks FOR SELECT
  USING (
    current_user_role() = 'field_supervisor'
    AND team_id = current_team_id()
  );

-- Finance: approved and invoiced tasks only
CREATE POLICY "tasks_finance_read" ON tasks FOR SELECT
  USING (
    current_user_role() = 'finance'
    AND status IN ('approved', 'invoiced')
  );

-- Admin and PM: all tasks
CREATE POLICY "tasks_admin_pm_read" ON tasks FOR SELECT
  USING (current_user_role() IN ('admin', 'project_manager'));

-- Technicians can insert their own tasks
CREATE POLICY "tasks_technician_insert" ON tasks FOR INSERT
  WITH CHECK (
    current_user_role() IN ('field_technician', 'field_supervisor')
    AND technician_id = auth.uid()
  );

-- Technicians can update their own pending tasks
CREATE POLICY "tasks_technician_update" ON tasks FOR UPDATE
  USING (
    technician_id = auth.uid()
    AND status = 'pending'
  );

-- Supervisors, admin, PM can update any task (for approval/rejection)
CREATE POLICY "tasks_supervisor_admin_update" ON tasks FOR UPDATE
  USING (current_user_role() IN ('admin', 'project_manager', 'field_supervisor'));

-- ─── TASK PHOTOS ──────────────────────────────────────────────────────────────
-- Read if you can read the task
CREATE POLICY "task_photos_read" ON task_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks t WHERE t.id = task_photos.task_id
    )
  );

CREATE POLICY "task_photos_insert" ON task_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_photos.task_id
        AND t.technician_id = auth.uid()
    )
  );

-- ─── INVOICES ─────────────────────────────────────────────────────────────────
-- Finance, admin, PM can read invoices
CREATE POLICY "invoices_finance_read" ON invoices FOR SELECT
  USING (current_user_role() IN ('admin', 'project_manager', 'finance'));

-- Supervisors read-only
CREATE POLICY "invoices_supervisor_read" ON invoices FOR SELECT
  USING (current_user_role() = 'field_supervisor');

-- Finance and PM can create/update invoices
CREATE POLICY "invoices_finance_pm_write" ON invoices FOR ALL
  USING (current_user_role() IN ('admin', 'project_manager', 'finance'));

CREATE POLICY "invoice_lines_finance_read" ON invoice_lines FOR SELECT
  USING (current_user_role() IN ('admin', 'project_manager', 'finance', 'field_supervisor'));

CREATE POLICY "invoice_lines_finance_write" ON invoice_lines FOR ALL
  USING (current_user_role() IN ('admin', 'project_manager', 'finance'));

-- ─── MATERIALS ────────────────────────────────────────────────────────────────
CREATE POLICY "materials_authenticated_read" ON materials FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "materials_admin_pm_write" ON materials FOR ALL
  USING (current_user_role() IN ('admin', 'project_manager'));

-- ─── AUDIT LOG ────────────────────────────────────────────────────────────────
CREATE POLICY "audit_log_admin_read" ON audit_log FOR SELECT
  USING (current_user_role() = 'admin');

-- System can always insert to audit log (via service role)
CREATE POLICY "audit_log_system_insert" ON audit_log FOR INSERT
  WITH CHECK (TRUE);
