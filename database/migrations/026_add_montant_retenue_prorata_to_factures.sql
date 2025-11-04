-- ============================================
-- Migration 026: Ajout montant_retenue et montant_prorata aux factures
-- Description: Permet de stocker les montants manuels de retenue et prorata
-- Author: Claude Code
-- Date: 2025-11-04
-- ============================================

-- ============================================
-- 1. AJOUT COLONNES MONTANTS
-- ============================================

-- Colonne pour le montant de retenue (modifiable manuellement)
ALTER TABLE factures ADD COLUMN montant_retenue DECIMAL(10,2) DEFAULT 0;

-- Colonne pour le montant de prorata (modifiable manuellement)
ALTER TABLE factures ADD COLUMN montant_prorata DECIMAL(10,2) DEFAULT 0;

-- Commentaires
COMMENT ON COLUMN factures.montant_retenue IS 'Montant de la retenue de garantie (modifiable manuellement, défaut 5% du HT)';
COMMENT ON COLUMN factures.montant_prorata IS 'Montant du prorata (modifiable manuellement, défaut 2% du HT)';

-- ============================================
-- 2. MODIFICATION FONCTION get_montant_a_payer
-- ============================================

-- Supprimer l'ancienne version de la fonction
DROP FUNCTION IF EXISTS get_montant_a_payer(p_type TEXT, p_tva_applicable BOOLEAN, p_montant_ht DECIMAL(10,2), p_montant_ttc DECIMAL(10,2), p_retenue_garantie BOOLEAN, p_prorata_applicable BOOLEAN);

-- Créer la nouvelle fonction avec les paramètres montant_retenue et montant_prorata
CREATE OR REPLACE FUNCTION get_montant_a_payer(
  p_type TEXT,
  p_tva_applicable BOOLEAN,
  p_montant_ht DECIMAL(10,2),
  p_montant_ttc DECIMAL(10,2),
  p_retenue_garantie BOOLEAN,
  p_prorata_applicable BOOLEAN,
  p_montant_retenue DECIMAL(10,2),
  p_montant_prorata DECIMAL(10,2)
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  montant_base DECIMAL(10,2);
BEGIN
  -- Fournisseur : toujours TTC, pas de retenue ni prorata
  IF p_type = 'fournisseur' THEN
    RETURN p_montant_ttc;
  END IF;

  -- Client : TTC si TVA applicable, sinon HT
  IF p_tva_applicable THEN
    montant_base := p_montant_ttc;
  ELSE
    montant_base := p_montant_ht;
  END IF;

  -- Déduire le montant de retenue stocké (si applicable)
  IF p_retenue_garantie THEN
    montant_base := montant_base - COALESCE(p_montant_retenue, 0);
  END IF;

  -- Déduire le montant de prorata stocké (si applicable)
  IF p_prorata_applicable THEN
    montant_base := montant_base - COALESCE(p_montant_prorata, 0);
  END IF;

  RETURN montant_base;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_montant_a_payer IS 'Détermine le montant à payer selon le type, TVA, et les montants réels de retenue/prorata';

-- ============================================
-- 3. MODIFICATION TRIGGER PAIEMENT
-- ============================================

-- Modifier le trigger pour inclure montant_retenue et montant_prorata
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
  facture_retenue_garantie BOOLEAN;
  facture_prorata_applicable BOOLEAN;
  facture_montant_retenue DECIMAL(10,2);
  facture_montant_prorata DECIMAL(10,2);
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
    montant_ttc,
    retenue_garantie,
    prorata_applicable,
    montant_retenue,
    montant_prorata
  INTO
    facture_type,
    facture_tva_applicable,
    facture_montant_ht,
    facture_montant_ttc,
    facture_retenue_garantie,
    facture_prorata_applicable,
    facture_montant_retenue,
    facture_montant_prorata
  FROM factures
  WHERE id = facture_id_ref;

  -- Calculer le montant à payer avec la fonction helper
  montant_facture := get_montant_a_payer(
    facture_type,
    facture_tva_applicable,
    facture_montant_ht,
    facture_montant_ttc,
    facture_retenue_garantie,
    facture_prorata_applicable,
    facture_montant_retenue,
    facture_montant_prorata
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
-- 4. MIGRATION DES DONNÉES EXISTANTES
-- ============================================

-- Calculer et définir les montants de retenue pour les factures existantes
UPDATE factures
SET montant_retenue = montant_ht * 0.05
WHERE retenue_garantie = TRUE AND montant_retenue = 0;

-- Calculer et définir les montants de prorata pour les factures existantes
UPDATE factures
SET montant_prorata = montant_ht * 0.02
WHERE prorata_applicable = TRUE AND montant_prorata = 0;

-- ============================================
-- 5. INDEX POUR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_factures_montant_retenue ON factures(montant_retenue) WHERE retenue_garantie = TRUE;
CREATE INDEX IF NOT EXISTS idx_factures_montant_prorata ON factures(montant_prorata) WHERE prorata_applicable = TRUE;
