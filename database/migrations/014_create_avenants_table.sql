-- ============================================
-- Migration 014: Avenants System
-- Description: Create avenants table for chantier amendments
-- Author: Claude Code
-- Date: 2025-11-01
-- ============================================

-- ============================================
-- 1. AVENANTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS avenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relation chantier (obligatoire)
  chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,

  -- Numéro de l'avenant (auto-incrémenté par chantier)
  numero INTEGER NOT NULL,

  -- Montant HT de l'avenant
  montant_ht DECIMAL(10,2) NOT NULL,

  -- Description (optionnelle)
  description TEXT,

  -- Métadonnées
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT valid_montant_ht_avenant
    CHECK (montant_ht > 0),

  CONSTRAINT unique_numero_per_chantier
    UNIQUE (chantier_id, numero)
);

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_avenants_chantier_id ON avenants(chantier_id);
CREATE INDEX IF NOT EXISTS idx_avenants_created_at ON avenants(created_at DESC);

-- ============================================
-- 3. TRIGGER: Auto-update updated_at
-- ============================================

DROP TRIGGER IF EXISTS on_avenant_updated ON avenants;
CREATE TRIGGER on_avenant_updated
  BEFORE UPDATE ON avenants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE avenants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Avenants Policies (Admin only)
-- ============================================

-- Admin can do everything
CREATE POLICY "Admins can manage avenants"
  ON avenants FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- 5. COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE avenants IS 'Avenants (amendments) for chantiers - Admin only access';

COMMENT ON COLUMN avenants.chantier_id IS 'Chantier lié à cet avenant';
COMMENT ON COLUMN avenants.numero IS 'Numéro de l''avenant (auto-incrémenté par chantier)';
COMMENT ON COLUMN avenants.montant_ht IS 'Montant HT de l''avenant (doit être positif)';
COMMENT ON COLUMN avenants.description IS 'Description optionnelle de l''avenant';
