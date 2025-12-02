-- ============================================
-- Migration 060: Chantier Responsables
-- Description: Ajouter la possibilité d'assigner un ou plusieurs responsables à un chantier
-- Author: Claude Code
-- Date: 2025-12-02
-- ============================================

-- ============================================
-- 1. CREATE JUNCTION TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS chantier_responsables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Empêcher les doublons (même responsable sur même chantier)
  UNIQUE(chantier_id, contact_id)
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_chantier_responsables_chantier_id ON chantier_responsables(chantier_id);
CREATE INDEX IF NOT EXISTS idx_chantier_responsables_contact_id ON chantier_responsables(contact_id);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE chantier_responsables ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage chantier_responsables"
  ON chantier_responsables FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- 4. COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE chantier_responsables IS 'Table de jonction pour la relation many-to-many entre chantiers et responsables';
COMMENT ON COLUMN chantier_responsables.chantier_id IS 'Référence au chantier';
COMMENT ON COLUMN chantier_responsables.contact_id IS 'Référence au contact (responsable du chantier)';
