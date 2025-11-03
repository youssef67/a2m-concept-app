-- ============================================
-- Storage Policies for appartements-photos bucket
-- Description: RLS policies for photo storage access (Admin only)
-- Author: Claude Code
-- Date: 2025-11-03
-- ============================================

-- ============================================
-- STORAGE POLICIES: appartements-photos bucket
-- ============================================

-- Policy 1: Allow admins to SELECT (view/download) photos
CREATE POLICY "Admins can view appartement photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'appartements-photos' AND
  public.is_admin()
);

-- Policy 2: Allow admins to INSERT (upload) photos
CREATE POLICY "Admins can upload appartement photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'appartements-photos' AND
  public.is_admin()
);

-- Policy 3: Allow admins to DELETE photos
CREATE POLICY "Admins can delete appartement photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'appartements-photos' AND
  public.is_admin()
);

-- Note: No UPDATE policy needed as we don't update files, we delete and re-upload
