-- ─── STORAGE BUCKETS ──────────────────────────────────────────────────────────
-- task-photos: technician photo evidence (before/after per task)
-- exports:     generated PDF & Excel invoice files (server-side upload)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'task-photos',
    'task-photos',
    FALSE,                        -- private; access via signed URLs
    5242880,                      -- 5 MB per photo (compressed by expo-image-manipulator)
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  ),
  (
    'exports',
    'exports',
    FALSE,                        -- private; finance role only
    52428800,                     -- 50 MB (large Excel/PDF files)
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  )
ON CONFLICT (id) DO NOTHING;

-- ─── task-photos RLS ──────────────────────────────────────────────────────────

-- Technician can upload photos only for their own tasks
CREATE POLICY "task_photos_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-photos'
  AND (
    -- Path format: {task_client_id}/{photo_id}_{order}.jpg
    -- Verify the task belongs to the uploading technician via client_id prefix
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.client_id::TEXT = (string_to_array(name, '/'))[1]
        AND t.technician_id = auth.uid()
    )
  )
);

-- Anyone who can read the task can read its photos
CREATE POLICY "task_photos_read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-photos'
  AND EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.client_id::TEXT = (string_to_array(name, '/'))[1]
  )
);

-- Technician can delete/replace their own photos (while task is pending)
CREATE POLICY "task_photos_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-photos'
  AND EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.client_id::TEXT = (string_to_array(name, '/'))[1]
      AND t.technician_id = auth.uid()
      AND t.status = 'pending'
  )
);

-- ─── exports RLS ──────────────────────────────────────────────────────────────

-- Only admin, PM, and finance can upload exports (done by service role from API routes)
CREATE POLICY "exports_service_upload"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'exports');

-- Finance, admin, PM, supervisor can download exports
CREATE POLICY "exports_finance_read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'exports'
  AND (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  ) IN ('admin', 'project_manager', 'finance', 'field_supervisor')
);
