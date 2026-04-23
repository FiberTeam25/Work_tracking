-- ─── GPS coordinates for seed cabinets (New Cairo 5th Settlement area) ─────
-- ST_MakePoint(longitude, latitude)
UPDATE cabinets SET location = ST_SetSRID(ST_MakePoint(31.4686, 30.0275), 4326) WHERE code = 'CAB-001';
UPDATE cabinets SET location = ST_SetSRID(ST_MakePoint(31.4710, 30.0295), 4326) WHERE code = 'CAB-002';
UPDATE cabinets SET location = ST_SetSRID(ST_MakePoint(31.4735, 30.0315), 4326) WHERE code = 'CAB-003';
UPDATE cabinets SET location = ST_SetSRID(ST_MakePoint(31.4720, 30.0260), 4326) WHERE code = 'CAB-004';
UPDATE cabinets SET location = ST_SetSRID(ST_MakePoint(31.4700, 30.0240), 4326) WHERE code = 'CAB-005';

-- ─── Sample boxes with GPS (8 boxes across 5 cabinets) ───────────────────────
INSERT INTO boxes (id, cabinet_id, code, type, fiber_count, location, status) VALUES
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000001', 'BOX-001-A', 'closure',  24, ST_SetSRID(ST_MakePoint(31.4693, 30.0280), 4326), 'completed'),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000001', 'BOX-001-B', 'splitter', 12, ST_SetSRID(ST_MakePoint(31.4700, 30.0285), 4326), 'completed'),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0001-000000000002', 'BOX-002-A', 'closure',  24, ST_SetSRID(ST_MakePoint(31.4715, 30.0290), 4326), 'completed'),
  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0001-000000000002', 'BOX-002-B', 'splitter', 12, ST_SetSRID(ST_MakePoint(31.4718, 30.0300), 4326), 'active'),
  ('00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0001-000000000003', 'BOX-003-A', 'closure',  24, ST_SetSRID(ST_MakePoint(31.4740, 30.0308), 4326), 'active'),
  ('00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0001-000000000003', 'BOX-003-B', 'splitter', 12, ST_SetSRID(ST_MakePoint(31.4732, 30.0322), 4326), 'planned'),
  ('00000000-0000-0000-0002-000000000007', '00000000-0000-0000-0001-000000000004', 'BOX-004-A', 'closure',  24, ST_SetSRID(ST_MakePoint(31.4725, 30.0254), 4326), 'completed'),
  ('00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0001-000000000005', 'BOX-005-A', 'closure',  12, ST_SetSRID(ST_MakePoint(31.4705, 30.0244), 4326), 'planned')
ON CONFLICT (id) DO NOTHING;

-- ─── get_map_data: returns cabinets + boxes + route tasks as JSON for Leaflet ─
CREATE OR REPLACE FUNCTION get_map_data(p_site_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN json_build_object(
    'cabinets', COALESCE(
      (SELECT json_agg(row_to_json(c_data))
       FROM (
         SELECT
           c.id, c.code, c.type, c.status, c.fiber_count,
           ST_Y(c.location::geometry) AS lat,
           ST_X(c.location::geometry) AS lng
         FROM cabinets c
         WHERE c.site_id = p_site_id
           AND c.location IS NOT NULL
       ) c_data),
      '[]'::json
    ),
    'boxes', COALESCE(
      (SELECT json_agg(row_to_json(b_data))
       FROM (
         SELECT
           b.id, b.code, b.type, b.status, b.cabinet_id,
           ST_Y(b.location::geometry) AS lat,
           ST_X(b.location::geometry) AS lng
         FROM boxes b
         JOIN cabinets c ON c.id = b.cabinet_id
         WHERE c.site_id = p_site_id
           AND b.location IS NOT NULL
       ) b_data),
      '[]'::json
    ),
    'routes', COALESCE(
      (SELECT json_agg(row_to_json(r_data))
       FROM (
         SELECT
           t.id, t.status,
           t.route_length_m AS length_m,
           ST_AsGeoJSON(t.route_geometry::geometry)::json AS geojson
         FROM tasks t
         WHERE t.site_id = p_site_id
           AND t.task_type = 'route'
           AND t.route_geometry IS NOT NULL
       ) r_data),
      '[]'::json
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_map_data(UUID) TO authenticated;
