-- ============================================
-- Migration 006: Chantier Documents System
-- Description: Create table for PDF documents attached to chantiers
-- Author: Claude Code
-- Date: 2025-10-30
-- ============================================

-- ============================================
-- 1. CHANTIER_DOCUMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS chantier_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relation chantier (cascade delete)
  chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,

  -- Informations fichier
  nom_fichier TEXT NOT NULL,
  nom_original TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  taille_fichier BIGINT NOT NULL,
  type_mime TEXT NOT NULL DEFAULT 'application/pdf',

  -- Métadonnées
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contraintes de validation
  CONSTRAINT valid_file_size
    CHECK (taille_fichier > 0 AND taille_fichier <= 10485760),
  CONSTRAINT valid_mime_type
    CHECK (type_mime = 'application/pdf')
);

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_chantier_documents_chantier_id
  ON chantier_documents(chantier_id);

CREATE INDEX IF NOT EXISTS idx_chantier_documents_created_at
  ON chantier_documents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chantier_documents_storage_path
  ON chantier_documents(storage_path);

-- ============================================
-- 3. TRIGGER: Auto-update updated_at
-- ============================================

-- Reuse existing handle_updated_at() function
DROP TRIGGER IF EXISTS on_chantier_document_updated ON chantier_documents;
CREATE TRIGGER on_chantier_document_updated
  BEFORE UPDATE ON chantier_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE chantier_documents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Chantier Documents Policies (Admin only)
-- ============================================

-- Admin can do everything
CREATE POLICY "Admins can manage chantier documents"
  ON chantier_documents FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- 5. COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE chantier_documents IS 'PDF documents attached to chantiers - Admin only access';

COMMENT ON COLUMN chantier_documents.chantier_id IS 'ID du chantier associé';
COMMENT ON COLUMN chantier_documents.nom_fichier IS 'Nom du fichier pour affichage';
COMMENT ON COLUMN chantier_documents.nom_original IS 'Nom original du fichier uploadé';
COMMENT ON COLUMN chantier_documents.storage_path IS 'Chemin dans Supabase Storage';
COMMENT ON COLUMN chantier_documents.taille_fichier IS 'Taille en bytes (max 10MB)';
COMMENT ON COLUMN chantier_documents.type_mime IS 'Type MIME (application/pdf uniquement)';
COMMENT ON COLUMN chantier_documents.uploaded_by IS 'Utilisateur ayant uploadé le document';
