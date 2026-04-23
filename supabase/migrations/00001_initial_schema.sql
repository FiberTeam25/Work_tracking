-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ENUMS
CREATE TYPE user_role AS ENUM (
  'admin',
  'project_manager',
  'field_supervisor',
  'field_technician',
  'finance'
);

CREATE TYPE task_status AS ENUM (
  'draft',
  'pending',
  'approved',
  'rejected',
  'invoiced'
);

CREATE TYPE task_type AS ENUM ('route', 'node');

CREATE TYPE invoice_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'issued',
  'paid'
);

-- PROJECTS
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        TEXT UNIQUE NOT NULL,          -- e.g. 'FBR-2026-01'
  name_ar     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  client_name TEXT,
  start_date  DATE,
  end_date    DATE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SITES
CREATE TABLE sites (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  code       TEXT NOT NULL,
  name_ar    TEXT NOT NULL,
  name_en    TEXT NOT NULL,
  location   GEOMETRY(Point, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, code)
);

-- CABINETS
CREATE TABLE cabinets (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id    UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  code       TEXT NOT NULL,               -- e.g. 'CAB-001'
  type       TEXT NOT NULL,               -- 'ODF' | 'FDT' | 'FAT' etc.
  location   GEOMETRY(Point, 4326),
  status     TEXT NOT NULL DEFAULT 'planned', -- 'planned' | 'active' | 'completed'
  fiber_count INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(site_id, code)
);

-- BOXES (splitter/closure boxes)
CREATE TABLE boxes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabinet_id  UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  code        TEXT NOT NULL,
  fiber_count INT,
  location    GEOMETRY(Point, 4326),
  status      TEXT NOT NULL DEFAULT 'planned',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cabinet_id, code)
);

-- TEAMS
CREATE TABLE teams (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  code          TEXT NOT NULL,
  supervisor_id UUID,                      -- references auth.users, set after profiles created
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, code)
);

-- PROFILES (extends auth.users)
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  role            user_role NOT NULL DEFAULT 'field_technician',
  team_id         UUID REFERENCES teams(id),
  can_see_prices  BOOLEAN NOT NULL DEFAULT FALSE,
  lang            TEXT NOT NULL DEFAULT 'ar',
  phone           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK from teams.supervisor_id to profiles now that profiles exists
ALTER TABLE teams ADD CONSTRAINT teams_supervisor_id_fkey
  FOREIGN KEY (supervisor_id) REFERENCES profiles(id);

-- CONTRACT GROUPS
CREATE TABLE contract_groups (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  code       TEXT NOT NULL,               -- 'A' | 'B' | 'C'
  name_ar    TEXT NOT NULL,
  name_en    TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE(project_id, code)
);

-- CONTRACT ITEMS (BOQ)
CREATE TABLE contract_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id        UUID NOT NULL REFERENCES contract_groups(id) ON DELETE CASCADE,
  code            TEXT NOT NULL,          -- 'A1', 'B3' etc.
  description_ar  TEXT NOT NULL,
  description_en  TEXT NOT NULL,
  unit            TEXT NOT NULL,          -- 'متر' | 'عدد'
  task_type       task_type NOT NULL,
  contract_qty    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  unit_price      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sort_order      INT NOT NULL DEFAULT 0,
  UNIQUE(group_id, code)
);

-- TASKS (core work log)
CREATE TABLE tasks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id         UUID UNIQUE,           -- device-generated UUID for offline sync
  project_id        UUID NOT NULL REFERENCES projects(id),
  site_id           UUID REFERENCES sites(id),
  contract_item_id  UUID REFERENCES contract_items(id),
  team_id           UUID REFERENCES teams(id),
  technician_id     UUID REFERENCES profiles(id),
  task_date         DATE NOT NULL,
  task_type         task_type NOT NULL,
  status            task_status NOT NULL DEFAULT 'pending',

  -- Route fields
  from_cabinet_id   UUID REFERENCES cabinets(id),
  to_box_id         UUID REFERENCES boxes(id),
  route_length_m    NUMERIC(10, 2),
  route_geometry    GEOMETRY(LineString, 4326),

  -- Node fields
  node_cabinet_id   UUID REFERENCES cabinets(id),
  node_box_id       UUID REFERENCES boxes(id),
  quantity          NUMERIC(10, 2),

  -- Pricing (unit_price copied from contract_items at submit time)
  unit_price        NUMERIC(12, 2),
  line_total        NUMERIC(14, 2) GENERATED ALWAYS AS (
    CASE
      WHEN task_type = 'route' THEN COALESCE(route_length_m, 0) * COALESCE(unit_price, 0)
      WHEN task_type = 'node'  THEN COALESCE(quantity, 0) * COALESCE(unit_price, 0)
      ELSE 0
    END
  ) STORED,

  -- GPS
  gps_location      GEOMETRY(Point, 4326),
  gps_accuracy_m    NUMERIC(8, 2),

  -- Workflow
  notes             TEXT,
  submitted_at      TIMESTAMPTZ,
  reviewed_by       UUID REFERENCES profiles(id),
  reviewed_at       TIMESTAMPTZ,
  rejected_reason   TEXT,
  invoice_id        UUID,                  -- FK added after invoices table created

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TASK PHOTOS
CREATE TABLE task_photos (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id        UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  storage_path   TEXT NOT NULL,
  public_url     TEXT,
  gps_location   GEOMETRY(Point, 4326),
  photo_order    INT NOT NULL DEFAULT 0,   -- 0=before, 1=after
  taken_at       TIMESTAMPTZ,
  exif_data      JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INVOICES
CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES projects(id),
  site_id         UUID REFERENCES sites(id),
  invoice_number  TEXT UNIQUE NOT NULL,    -- 'INV-2026-001'
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  status          invoice_status NOT NULL DEFAULT 'draft',

  subtotal        NUMERIC(14, 2) NOT NULL DEFAULT 0,
  retention_pct   NUMERIC(5, 2) NOT NULL DEFAULT 10,
  tax_pct         NUMERIC(5, 2) NOT NULL DEFAULT 1,
  retention_amt   NUMERIC(14, 2) GENERATED ALWAYS AS
                    (ROUND(subtotal * retention_pct / 100, 2)) STORED,
  tax_amt         NUMERIC(14, 2) GENERATED ALWAYS AS
                    (ROUND(subtotal * tax_pct / 100, 2)) STORED,
  net_payable     NUMERIC(14, 2) GENERATED ALWAYS AS
                    (subtotal - ROUND(subtotal * retention_pct / 100, 2) - ROUND(subtotal * tax_pct / 100, 2)) STORED,

  pdf_url         TEXT,
  excel_url       TEXT,
  notes           TEXT,

  created_by      UUID REFERENCES profiles(id),
  approved_by     UUID REFERENCES profiles(id),
  approved_at     TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INVOICE LINE ITEMS (aggregated by BOQ code)
CREATE TABLE invoice_lines (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id        UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  contract_item_id  UUID NOT NULL REFERENCES contract_items(id),
  quantity          NUMERIC(12, 2) NOT NULL,
  unit_price        NUMERIC(12, 2) NOT NULL,
  line_total        NUMERIC(14, 2) GENERATED ALWAYS AS
                      (ROUND(quantity * unit_price, 2)) STORED,
  task_count        INT NOT NULL DEFAULT 0
);

-- Add invoice FK back to tasks now that invoices table exists
ALTER TABLE tasks ADD CONSTRAINT tasks_invoice_id_fkey
  FOREIGN KEY (invoice_id) REFERENCES invoices(id);

-- MATERIALS
CREATE TABLE materials (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name_ar         TEXT NOT NULL,
  name_en         TEXT NOT NULL,
  unit            TEXT NOT NULL,
  contract_qty    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  consumed_qty    NUMERIC(12, 2) NOT NULL DEFAULT 0,  -- updated by trigger on task approval
  alert_threshold NUMERIC(5, 2) NOT NULL DEFAULT 90,  -- alert when consumed_qty/contract_qty > threshold%
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AUDIT LOG
CREATE TABLE audit_log (
  id           BIGSERIAL PRIMARY KEY,
  table_name   TEXT NOT NULL,
  record_id    UUID,
  operation    TEXT NOT NULL,             -- 'INSERT' | 'UPDATE' | 'DELETE'
  old_data     JSONB,
  new_data     JSONB,
  performed_by UUID REFERENCES profiles(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_tasks_project_id     ON tasks(project_id);
CREATE INDEX idx_tasks_team_id        ON tasks(team_id);
CREATE INDEX idx_tasks_technician_id  ON tasks(technician_id);
CREATE INDEX idx_tasks_status         ON tasks(status);
CREATE INDEX idx_tasks_task_date      ON tasks(task_date DESC);
CREATE INDEX idx_tasks_client_id      ON tasks(client_id);
CREATE INDEX idx_tasks_invoice_id     ON tasks(invoice_id);
CREATE INDEX idx_task_photos_task_id  ON task_photos(task_id);
CREATE INDEX idx_audit_log_table      ON audit_log(table_name, record_id);

-- Spatial indexes
CREATE INDEX idx_cabinets_location    ON cabinets USING GIST(location);
CREATE INDEX idx_boxes_location       ON boxes USING GIST(location);
CREATE INDEX idx_tasks_gps            ON tasks USING GIST(gps_location);
