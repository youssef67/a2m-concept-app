-- ============================================
-- Migration 009: Système de Paiement des Factures
-- Description: Ajout table paiements + statut partiellement_payee + trigger auto-update
-- Author: Claude Code
-- Date: 2025-10-30
-- ============================================

-- ============================================
-- 1. TABLE PAIEMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS paiements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relation facture (cascade delete)
  facture_id UUID NOT NULL REFERENCES factures(id) ON DELETE CASCADE,

  -- Informations paiement
  montant DECIMAL(10,2) NOT NULL CHECK (montant > 0),
  date_paiement DATE NOT NULL,
  reference TEXT,  -- numéro de virement, référence bancaire, etc.
  notes TEXT,

  -- Métadonnées
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT valid_date_paiement CHECK (date_paiement <= CURRENT_DATE)
);

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_paiements_facture_id
  ON paiements(facture_id);

CREATE INDEX IF NOT EXISTS idx_paiements_date
  ON paiements(date_paiement DESC);

CREATE INDEX IF NOT EXISTS idx_paiements_created_at
  ON paiements(created_at DESC);

-- ============================================
-- 3. MODIFIER TABLE FACTURES - Ajouter nouveau statut
-- ============================================

-- Supprimer ancienne contrainte
ALTER TABLE factures DROP CONSTRAINT IF EXISTS factures_statut_check;

-- Ajouter nouveau statut "partiellement_payee"
ALTER TABLE factures ADD CONSTRAINT factures_statut_check
  CHECK (statut IN ('en_attente', 'partiellement_payee', 'payee', 'annulee'));

-- ============================================
-- 4. FONCTION TRIGGER - Auto-update statut facture
-- ============================================

CREATE OR REPLACE FUNCTION update_facture_statut_on_paiement()
RETURNS TRIGGER AS $$
DECLARE
  total_paye DECIMAL(10,2);
  montant_facture DECIMAL(10,2);
  facture_id_ref UUID;
BEGIN
  -- Déterminer l'ID de la facture (INSERT/UPDATE vs DELETE)
  IF TG_OP = 'DELETE' THEN
    facture_id_ref := OLD.facture_id;
  ELSE
    facture_id_ref := NEW.facture_id;
  END IF;

  -- Calculer total payé pour cette facture
  SELECT COALESCE(SUM(montant), 0) INTO total_paye
  FROM paiements
  WHERE facture_id = facture_id_ref;

  -- Récupérer montant de la facture
  SELECT montant INTO montant_facture
  FROM factures
  WHERE id = facture_id_ref;

  -- Mettre à jour le statut selon le montant payé
  UPDATE factures
  SET statut = CASE
    WHEN total_paye = 0 THEN 'en_attente'
    WHEN total_paye >= montant_facture THEN 'payee'
    ELSE 'partiellement_payee'
  END,
  updated_at = NOW()
  WHERE id = facture_id_ref;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. TRIGGERS
-- ============================================

-- Trigger auto-update statut après INSERT/UPDATE/DELETE paiement
DROP TRIGGER IF EXISTS trg_update_statut_after_paiement ON paiements;
CREATE TRIGGER trg_update_statut_after_paiement
  AFTER INSERT OR UPDATE OR DELETE ON paiements
  FOR EACH ROW
  EXECUTE FUNCTION update_facture_statut_on_paiement();

-- Trigger auto-update updated_at
DROP TRIGGER IF EXISTS on_paiement_updated ON paiements;
CREATE TRIGGER on_paiement_updated
  BEFORE UPDATE ON paiements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;

-- Admin only - Full access
DROP POLICY IF EXISTS "Admins can manage paiements" ON paiements;
CREATE POLICY "Admins can manage paiements"
  ON paiements
  FOR ALL
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- ============================================
-- 7. COMMENTS
-- ============================================

COMMENT ON TABLE paiements IS 'Paiements des factures (virement uniquement)';
COMMENT ON COLUMN paiements.facture_id IS 'Référence vers la facture';
COMMENT ON COLUMN paiements.montant IS 'Montant du paiement en EUR';
COMMENT ON COLUMN paiements.date_paiement IS 'Date du paiement (max aujourd''hui)';
COMMENT ON COLUMN paiements.reference IS 'Référence bancaire ou numéro de virement';
COMMENT ON COLUMN paiements.notes IS 'Notes additionnelles sur le paiement';
