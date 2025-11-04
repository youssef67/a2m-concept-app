-- ============================================
-- Migration 027: Simplifier get_montant_a_payer pour retourner le TTC
-- Description: La fonction retourne maintenant le TTC (ou HT) sans déduire retenue/prorata
-- Author: Claude Code
-- Date: 2025-11-04
-- ============================================

-- ============================================
-- MODIFICATION FONCTION get_montant_a_payer
-- ============================================

-- Supprimer l'ancienne version de la fonction
DROP FUNCTION IF EXISTS get_montant_a_payer(p_type TEXT, p_tva_applicable BOOLEAN, p_montant_ht DECIMAL(10,2), p_montant_ttc DECIMAL(10,2), p_retenue_garantie BOOLEAN, p_prorata_applicable BOOLEAN, p_montant_retenue DECIMAL(10,2), p_montant_prorata DECIMAL(10,2));

-- Créer la nouvelle fonction simplifiée (retourne TTC ou HT sans déductions)
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
BEGIN
  -- Fournisseur : toujours TTC
  IF p_type = 'fournisseur' THEN
    RETURN p_montant_ttc;
  END IF;

  -- Client : TTC si TVA applicable, sinon HT (sans déduire retenue ni prorata)
  IF p_tva_applicable THEN
    RETURN p_montant_ttc;
  ELSE
    RETURN p_montant_ht;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_montant_a_payer IS 'Retourne le montant TTC (ou HT si pas de TVA) sans déduire retenue ni prorata';
