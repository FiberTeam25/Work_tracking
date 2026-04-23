-- ─── CABINET PROGRESS MATERIALIZED VIEW ─────────────────────────────────────
-- Pre-aggregates task completion per cabinet for the dashboard progress bars
CREATE MATERIALIZED VIEW mv_cabinet_progress AS
SELECT
  c.id                                                      AS cabinet_id,
  c.site_id,
  s.project_id,
  c.code                                                    AS cabinet_code,
  c.type                                                    AS cabinet_type,
  c.status                                                  AS cabinet_status,
  COUNT(t.id)                                               AS total_tasks,
  COUNT(t.id) FILTER (WHERE t.status IN ('approved','invoiced')) AS approved_tasks,
  ROUND(
    COUNT(t.id) FILTER (WHERE t.status IN ('approved','invoiced'))::NUMERIC
    / NULLIF(COUNT(t.id), 0) * 100,
    1
  )                                                         AS completion_pct,
  COALESCE(SUM(t.route_length_m) FILTER (WHERE t.task_type = 'route'), 0) AS total_meters,
  COALESCE(SUM(t.quantity) FILTER (WHERE t.task_type = 'node'), 0)        AS total_nodes
FROM cabinets c
JOIN sites s ON s.id = c.site_id
LEFT JOIN tasks t ON (t.from_cabinet_id = c.id OR t.node_cabinet_id = c.id)
GROUP BY c.id, c.site_id, s.project_id, c.code, c.type, c.status;

CREATE UNIQUE INDEX ON mv_cabinet_progress(cabinet_id);
CREATE INDEX ON mv_cabinet_progress(project_id);

-- ─── PROJECT KPI MATERIALIZED VIEW ──────────────────────────────────────────
CREATE MATERIALIZED VIEW mv_project_kpis AS
SELECT
  p.id                                                         AS project_id,
  p.code                                                       AS project_code,
  p.name_ar,
  p.name_en,
  COUNT(t.id)                                                  AS total_tasks,
  COUNT(t.id) FILTER (WHERE t.status IN ('approved','invoiced')) AS completed_tasks,
  ROUND(
    COUNT(t.id) FILTER (WHERE t.status IN ('approved','invoiced'))::NUMERIC
    / NULLIF(COUNT(t.id), 0) * 100,
    1
  )                                                            AS completion_pct,
  COALESCE(SUM(t.route_length_m) FILTER (WHERE t.task_type = 'route'), 0)  AS total_meters,
  COUNT(t.id) FILTER (WHERE t.task_type = 'node')             AS total_nodes,
  COALESCE(SUM(t.line_total) FILTER (WHERE t.status IN ('approved','invoiced')), 0) AS approved_value,
  COALESCE(SUM(t.line_total) FILTER (WHERE t.status = 'pending'), 0)       AS pending_value,
  COUNT(t.id) FILTER (WHERE t.status = 'pending')             AS pending_count,
  NOW()                                                        AS refreshed_at
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id
GROUP BY p.id, p.code, p.name_ar, p.name_en;

CREATE UNIQUE INDEX ON mv_project_kpis(project_id);

-- ─── MATERIAL CONSUMPTION MATERIALIZED VIEW ───────────────────────────────────
CREATE MATERIALIZED VIEW mv_material_status AS
SELECT
  m.id                AS material_id,
  m.project_id,
  m.name_ar,
  m.name_en,
  m.unit,
  m.contract_qty,
  m.consumed_qty,
  m.alert_threshold,
  ROUND(m.consumed_qty / NULLIF(m.contract_qty, 0) * 100, 1) AS consumption_pct,
  CASE
    WHEN m.consumed_qty / NULLIF(m.contract_qty, 0) * 100 >= m.alert_threshold THEN 'critical'
    WHEN m.consumed_qty / NULLIF(m.contract_qty, 0) * 100 >= m.alert_threshold * 0.8 THEN 'warning'
    ELSE 'ok'
  END                 AS alert_level
FROM materials m;

CREATE UNIQUE INDEX ON mv_material_status(material_id);
CREATE INDEX ON mv_material_status(project_id);

-- ─── REFRESH FUNCTION ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void LANGUAGE SQL SECURITY DEFINER AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_cabinet_progress;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_project_kpis;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_material_status;
$$;

-- ─── pg_cron SCHEDULE (every 5 minutes) ─────────────────────────────────────
-- Requires pg_cron extension (enabled in migration 00001)
SELECT cron.schedule(
  'refresh-mv-every-5min',
  '*/5 * * * *',
  'SELECT refresh_all_materialized_views()'
);

-- Nightly material alert check at 23:55 (sends via Edge Function)
SELECT cron.schedule(
  'nightly-material-alerts',
  '55 23 * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.edge_function_url') || '/nightly-alerts',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    )
  $$
);
