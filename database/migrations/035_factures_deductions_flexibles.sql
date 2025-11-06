-- ============================================
-- Migration 035: Factures Déductions Flexibles
-- Description: Ajouter système de déductions flexibles avec intitulés personnalisés
-- Author: Claude Code
-- Date: 2025-11-06
-- ============================================

-- ============================================
-- 1. CREATE TABLE facture_deductions
-- ============================================

CREATE TABLE IF NOT EXISTS facture_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  intitule TEXT NOT NULL,
  pourcentage DECIMAL(5,2),
  montant DECIMAL(10,2) NOT NULL,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contrainte: pourcentage entre 0 et 100 si renseigné
  CONSTRAINT pourcentage_valide CHECK (pourcentage IS NULL OR (pourcentage >= 0 AND pourcentage <= 100)),

  -- Contrainte: montant positif
  CONSTRAINT montant_positif CHECK (montant >= 0)
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_facture_deductions_facture_id ON facture_deductions(facture_id);
CREATE INDEX IF NOT EXISTS idx_facture_deductions_ordre ON facture_deductions(facture_id, ordre);

-- ============================================
-- 3. MIGRATE EXISTING DATA
-- ============================================

-- Migrer les retenues de garantie existantes
INSERT INTO facture_deductions (facture_id, intitule, pourcentage, montant, ordre)
SELECT
  id,
  'Retenue de garantie',
  5.00,
  montant_retenue,
  1
FROM factures
WHERE type = 'client'
  AND retenue_garantie = TRUE
  AND montant_retenue > 0
ON CONFLICT DO NOTHING;

-- Migrer les prorata existants
INSERT INTO facture_deductions (facture_id, intitule, pourcentage, montant, ordre)
SELECT
  id,
  'Prorata',
  2.00,
  montant_prorata,
  2
FROM factures
WHERE type = 'client'
  AND prorata_applicable = TRUE
  AND montant_prorata > 0
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE facture_deductions ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage facture_deductions"
  ON facture_deductions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- 6. COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE facture_deductions IS 'Déductions flexibles pour les factures (retenue, prorata, autres)';
COMMENT ON COLUMN facture_deductions.facture_id IS 'Référence à la facture';
COMMENT ON COLUMN facture_deductions.intitule IS 'Libellé de la déduction (ex: Retenue de garantie)';
COMMENT ON COLUMN facture_deductions.pourcentage IS 'Pourcentage de la déduction (optionnel)';
COMMENT ON COLUMN facture_deductions.montant IS 'Montant de la déduction en euros';
COMMENT ON COLUMN facture_deductions.ordre IS 'Ordre d''affichage de la déduction';
