-- ============================================
-- Migration 008: Supabase Storage Bucket for Facture Documents
-- Description: Create storage bucket and RLS policies for PDF documents
-- Author: Claude Code
-- Date: 2025-10-30
-- ============================================

-- ============================================
-- 1. CREATE STORAGE BUCKET
-- ============================================

-- Insert bucket (delete if exists to allow re-running migration)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'facture-documents',
  'facture-documents',
  false, -- Private bucket (requires authentication)
  10485760, -- 10 MB max file size
  ARRAY['application/pdf']::text[] -- Only PDF files allowed
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf']::text[];

-- ============================================
-- 2. STORAGE POLICIES (RLS)
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can upload facture documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view facture documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update facture documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete facture documents" ON storage.objects;

-- Allow admins to upload files
CREATE POLICY "Admins can upload facture documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'facture-documents'
  AND (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  ) = 'admin'
);

-- Allow admins to view/download files
CREATE POLICY "Admins can view facture documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'facture-documents'
  AND (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  ) = 'admin'
);

-- Allow admins to update files
CREATE POLICY "Admins can update facture documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'facture-documents'
  AND (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  ) = 'admin'
)
WITH CHECK (
  bucket_id = 'facture-documents'
  AND (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  ) = 'admin'
);

-- Allow admins to delete files
CREATE POLICY "Admins can delete facture documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'facture-documents'
  AND (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  ) = 'admin'
);

-- ============================================
-- 3. COMMENTS
-- ============================================

COMMENT ON TABLE storage.buckets IS 'Storage buckets for file uploads';
COMMENT ON TABLE storage.objects IS 'Stored files metadata and paths';
