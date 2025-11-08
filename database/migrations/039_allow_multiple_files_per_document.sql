-- ============================================
-- Migration 039: Allow Multiple Files per Document
-- Description: Remove UNIQUE constraint to allow multiple files per document type per appartement
-- Author: Claude Code
-- Date: 2025-11-09
-- ============================================

-- ============================================
-- 1. DROP UNIQUE CONSTRAINT
-- ============================================

-- Remove the constraint that limits one file per document per appartement
ALTER TABLE appartement_documents
  DROP CONSTRAINT IF EXISTS unique_appartement_document;

-- ============================================
-- 2. ADD NEW COLUMNS
-- ============================================

-- Add order column for file ordering within a document type
ALTER TABLE appartement_documents
  ADD COLUMN IF NOT EXISTS ordre INTEGER DEFAULT 0;

-- ============================================
-- 3. UPDATE EXISTING DATA
-- ============================================

-- Set ordre to 0 for all existing documents (they are currently the first/only file)
UPDATE appartement_documents SET ordre = 0 WHERE ordre IS NULL;

-- ============================================
-- 4. CREATE NEW INDEX
-- ============================================

-- Index for efficient querying of documents ordered by upload order
CREATE INDEX IF NOT EXISTS idx_appartement_documents_ordre
  ON appartement_documents(appartement_id, document_requis_id, ordre);

-- ============================================
-- 5. COMMENTS (Documentation)
-- ============================================

COMMENT ON COLUMN appartement_documents.ordre IS 'Ordre d''affichage des fichiers pour un même document (0 = premier fichier)';
