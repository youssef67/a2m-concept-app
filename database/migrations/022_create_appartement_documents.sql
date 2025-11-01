-- ============================================
-- Migration 022: Appartement Documents System
-- Description: Create table for documents attached to appartements (linked to chantier_documents_requis)
-- Author: Claude Code
-- Date: 2025-11-01
-- ============================================

-- ============================================
-- 1. APPARTEMENT_DOCUMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS appartement_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  appartement_id UUID NOT NULL REFERENCES appartements(id) ON DELETE CASCADE,
  document_requis_id UUID NOT NULL REFERENCES chantier_documents_requis(id) ON DELETE CASCADE,

  -- Informations fichier
  nom_fichier TEXT NOT NULL,
  nom_original TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  taille_fichier BIGINT NOT NULL,
  type_mime TEXT NOT NULL,

  -- Métadonnées
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contraintes
  -- Un appartement ne peut avoir qu'UN fichier par document requis
  CONSTRAINT unique_appartement_document UNIQUE(appartement_id, document_requis_id),

  CONSTRAINT valid_file_size
    CHECK (taille_fichier > 0 AND taille_fichier <= 10485760),

  CONSTRAINT valid_mime_type
    CHECK (type_mime IN ('application/pdf', 'image/jpeg', 'image/png'))
);

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_appartement_documents_appartement_id
  ON appartement_documents(appartement_id);

CREATE INDEX IF NOT EXISTS idx_appartement_documents_document_requis_id
  ON appartement_documents(document_requis_id);

CREATE INDEX IF NOT EXISTS idx_appartement_documents_created_at
  ON appartement_documents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_appartement_documents_storage_path
  ON appartement_documents(storage_path);

-- ============================================
-- 3. TRIGGER: Auto-update updated_at
-- ============================================

DROP TRIGGER IF EXISTS on_appartement_document_updated ON appartement_documents;
CREATE TRIGGER on_appartement_document_updated
  BEFORE UPDATE ON appartement_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE appartement_documents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Appartement Documents Policies (Admin only)
-- ============================================

-- Admin can do everything
CREATE POLICY "Admins can manage appartement documents"
  ON appartement_documents FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- 5. COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE appartement_documents IS 'Documents (PDF/images) attached to appartements - Each document corresponds to a required document from the chantier';

COMMENT ON COLUMN appartement_documents.appartement_id IS 'ID de l''appartement associé';
COMMENT ON COLUMN appartement_documents.document_requis_id IS 'ID du document requis du chantier';
COMMENT ON COLUMN appartement_documents.nom_fichier IS 'Nom du fichier pour affichage';
COMMENT ON COLUMN appartement_documents.nom_original IS 'Nom original du fichier uploadé';
COMMENT ON COLUMN appartement_documents.storage_path IS 'Chemin dans Supabase Storage (bucket: appartements-documents)';
COMMENT ON COLUMN appartement_documents.taille_fichier IS 'Taille en bytes (max 10MB)';
COMMENT ON COLUMN appartement_documents.type_mime IS 'Type MIME (application/pdf, image/jpeg, image/png)';
COMMENT ON COLUMN appartement_documents.uploaded_by IS 'Utilisateur ayant uploadé le document';
