-- ============================================
-- Migration 011: Ajout gestion TVA aux factures
-- Description: Ajout colonnes TVA + fonction helper + modification trigger paiement
-- Author: Claude Code
-- Date: 2025-10-31
-- ============================================

-- ============================================
-- 1. AJOUT COLONNES TVA À LA TABLE FACTURES
-- ============================================

-- Colonnes pour la gestion de la TVA
ALTER TABLE factures ADD COLUMN montant_ht DECIMAL(10,2);
ALTER TABLE factures ADD COLUMN montant_ttc DECIMAL(10,2);
ALTER TABLE factures ADD COLUMN tva_applicable BOOLEAN DEFAULT FALSE;
ALTER TABLE factures ADD COLUMN taux_tva DECIMAL(5,2) DEFAULT 20.00;

-- Commentaires
COMMENT ON COLUMN factures.montant_ht IS 'Montant Hors Taxes (clients auto-liquidation ou base de calcul)';
COMMENT ON COLUMN factures.montant_ttc IS 'Montant Toutes Taxes Comprises (toujours rempli pour fournisseurs)';
COMMENT ON COLUMN factures.tva_applicable IS 'TRUE si TVA à 20% appliquée (factures clients), toujours TRUE pour fournisseurs';
COMMENT ON COLUMN factures.taux_tva IS 'Taux de TVA appliqué (fixe à 20%)';

-- ============================================
-- 2. FONCTION HELPER - Récupérer montant à payer
-- ============================================

CREATE OR REPLACE FUNCTION get_montant_a_payer(
  p_type TEXT,
  p_tva_applicable BOOLEAN,
  p_montant_ht DECIMAL(10,2),
  p_montant_ttc DECIMAL(10,2)
)
RETURNS DECIMAL(10,2) AS $$
BEGIN
  -- Fournisseur : toujours TTC
  IF p_type = 'fournisseur' THEN
    RETURN p_montant_ttc;
  END IF;

  -- Client : TTC si TVA applicable, sinon HT
  IF p_tva_applicable THEN
    RETURN p_montant_ttc;
  ELSE
    RETURN p_montant_ht;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_montant_a_payer IS 'Détermine le montant à payer selon le type de facture et la TVA';

-- ============================================
-- 3. MODIFICATION TRIGGER PAIEMENT
-- ============================================

-- Modifier le trigger pour utiliser get_montant_a_payer()
CREATE OR REPLACE FUNCTION update_facture_statut_on_paiement()
RETURNS TRIGGER AS $$
DECLARE
  total_paye DECIMAL(10,2);
  montant_facture DECIMAL(10,2);
  facture_id_ref UUID;
  facture_type TEXT;
  facture_tva_applicable BOOLEAN;
  facture_montant_ht DECIMAL(10,2);
  facture_montant_ttc DECIMAL(10,2);
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

  -- Récupérer les données de la facture
  SELECT
    type,
    tva_applicable,
    montant_ht,
    montant_ttc
  INTO
    facture_type,
    facture_tva_applicable,
    facture_montant_ht,
    facture_montant_ttc
  FROM factures
  WHERE id = facture_id_ref;

  -- Calculer le montant à payer avec la fonction helper
  montant_facture := get_montant_a_payer(
    facture_type,
    facture_tva_applicable,
    facture_montant_ht,
    facture_montant_ttc
  );

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
-- 4. CONTRAINTES DE VALIDATION
-- ============================================

-- Ajouter contrainte : au moins un des deux montants doit être rempli
ALTER TABLE factures ADD CONSTRAINT check_montants_tva
  CHECK (
    (type = 'client' AND tva_applicable = FALSE AND montant_ht IS NOT NULL AND montant_ttc IS NULL) OR
    (type = 'client' AND tva_applicable = TRUE AND montant_ht IS NOT NULL AND montant_ttc IS NOT NULL) OR
    (type = 'fournisseur' AND montant_ttc IS NOT NULL)
  );

COMMENT ON CONSTRAINT check_montants_tva ON factures IS
  'Validation: Clients sans TVA = HT uniquement, Clients avec TVA = HT+TTC, Fournisseurs = TTC uniquement';

-- ============================================
-- 5. INDEX POUR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_factures_tva_applicable ON factures(tva_applicable);
CREATE INDEX IF NOT EXISTS idx_factures_type_tva ON factures(type, tva_applicable);
