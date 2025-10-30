-- ============================================
-- Migration 005: Chantiers System
-- Description: Create chantiers table with client relationship
-- Author: Claude Code
-- Date: 2025-10-30
-- ============================================

-- ============================================
-- 1. CHANTIERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS chantiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Informations principales
  titre TEXT NOT NULL,
  description TEXT,
  statut TEXT NOT NULL CHECK (statut IN ('en_cours', 'planifie', 'devis')),

  -- Relation client (obligatoire)
  client_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,

  -- Dates
  date_debut DATE,
  date_fin_prevue DATE,
  date_fin_reelle DATE,

  -- Financier (simple pour l'instant)
  budget_estime DECIMAL(10,2),
  cout_reel DECIMAL(10,2),

  -- Adresse du chantier (intégrée dans la table)
  adresse_ligne1 TEXT NOT NULL,
  adresse_ligne2 TEXT,
  ville TEXT NOT NULL,
  code_postal TEXT NOT NULL,
  pays TEXT DEFAULT 'France',

  -- Notes
  notes TEXT,

  -- Métadonnées
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contraintes de validation
  CONSTRAINT valid_date_range
    CHECK (
      (date_debut IS NULL OR date_fin_prevue IS NULL) OR
      (date_fin_prevue >= date_debut)
    ),
  CONSTRAINT valid_budget
    CHECK (budget_estime IS NULL OR budget_estime >= 0),
  CONSTRAINT valid_cout
    CHECK (cout_reel IS NULL OR cout_reel >= 0)
);

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_chantiers_statut ON chantiers(statut);
CREATE INDEX IF NOT EXISTS idx_chantiers_client_id ON chantiers(client_id);
CREATE INDEX IF NOT EXISTS idx_chantiers_created_by ON chantiers(created_by);
CREATE INDEX IF NOT EXISTS idx_chantiers_created_at ON chantiers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chantiers_date_debut ON chantiers(date_debut);

-- ============================================
-- 3. TRIGGER: Auto-update updated_at
-- ============================================

-- Reuse existing handle_updated_at() function
DROP TRIGGER IF EXISTS on_chantier_updated ON chantiers;
CREATE TRIGGER on_chantier_updated
  BEFORE UPDATE ON chantiers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE chantiers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Chantiers Policies (Admin only)
-- ============================================

-- Admin can do everything
CREATE POLICY "Admins can manage chantiers"
  ON chantiers FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- 5. COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE chantiers IS 'Chantiers (construction sites) - Admin only access';

COMMENT ON COLUMN chantiers.titre IS 'Titre du chantier';
COMMENT ON COLUMN chantiers.statut IS 'Statut: en_cours, planifie, or devis';
COMMENT ON COLUMN chantiers.client_id IS 'Client lié au chantier (obligatoire)';
COMMENT ON COLUMN chantiers.date_debut IS 'Date de début du chantier';
COMMENT ON COLUMN chantiers.date_fin_prevue IS 'Date de fin prévue';
COMMENT ON COLUMN chantiers.date_fin_reelle IS 'Date de fin réelle (remplie à la fin)';
COMMENT ON COLUMN chantiers.budget_estime IS 'Budget estimé en euros';
COMMENT ON COLUMN chantiers.cout_reel IS 'Coût réel final en euros';
COMMENT ON COLUMN chantiers.adresse_ligne1 IS 'Adresse du chantier (ligne 1)';
COMMENT ON COLUMN chantiers.ville IS 'Ville du chantier';
COMMENT ON COLUMN chantiers.code_postal IS 'Code postal du chantier';
COMMENT ON COLUMN chantiers.notes IS 'Notes additionnelles sur le chantier';
