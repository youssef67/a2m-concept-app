-- ============================================
-- Migration 012: Ajout retenue de garantie aux factures
-- Description: Ajout colonne retenue_garantie + modification fonction get_montant_a_payer
-- Author: Claude Code
-- Date: 2025-10-31
-- ============================================

-- ============================================
-- 1. AJOUT COLONNE RETENUE DE GARANTIE
-- ============================================

-- Colonne pour la retenue de garantie (5% du montant HT)
ALTER TABLE factures ADD COLUMN retenue_garantie BOOLEAN DEFAULT FALSE;

-- Commentaire
COMMENT ON COLUMN factures.retenue_garantie IS 'TRUE si retenue de garantie de 5% appliquée (uniquement pour factures clients)';

-- ============================================
-- 2. MODIFICATION FONCTION get_montant_a_payer
-- ============================================

-- Supprimer l'ancienne version de la fonction (avec 4 paramètres)
DROP FUNCTION IF EXISTS get_montant_a_payer(TEXT, BOOLEAN, DECIMAL(10,2), DECIMAL(10,2));

-- Créer la nouvelle fonction avec le paramètre retenue_garantie
CREATE OR REPLACE FUNCTION get_montant_a_payer(
  p_type TEXT,
  p_tva_applicable BOOLEAN,
  p_montant_ht DECIMAL(10,2),
  p_montant_ttc DECIMAL(10,2),
  p_retenue_garantie BOOLEAN
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  montant_base DECIMAL(10,2);
  montant_retenue DECIMAL(10,2);
BEGIN
  -- Fournisseur : toujours TTC, pas de retenue
  IF p_type = 'fournisseur' THEN
    RETURN p_montant_ttc;
  END IF;

  -- Client : TTC si TVA applicable, sinon HT
  IF p_tva_applicable THEN
    montant_base := p_montant_ttc;
  ELSE
    montant_base := p_montant_ht;
  END IF;

  -- Déduire la retenue de garantie si applicable (toujours 5% du HT)
  IF p_retenue_garantie THEN
    montant_retenue := p_montant_ht * 0.05;
    RETURN montant_base - montant_retenue;
  END IF;

  RETURN montant_base;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_montant_a_payer IS 'Détermine le montant à payer selon le type, TVA et retenue de garantie';

-- ============================================
-- 3. MODIFICATION TRIGGER PAIEMENT
-- ============================================

-- Modifier le trigger pour inclure retenue_garantie
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
    retenue_garantie
  INTO
    facture_type,
    facture_tva_applicable,
    facture_montant_ht,
    facture_montant_ttc,
    facture_retenue_garantie
  FROM factures
  WHERE id = facture_id_ref;

  -- Calculer le montant à payer avec la fonction helper
  montant_facture := get_montant_a_payer(
    facture_type,
    facture_tva_applicable,
    facture_montant_ht,
    facture_montant_ttc,
    facture_retenue_garantie
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
-- 4. INDEX POUR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_factures_retenue ON factures(retenue_garantie);
