-- ============================================
-- Migration 015: Ajout prorata aux factures
-- Description: Ajout colonne prorata_applicable + modification fonction get_montant_a_payer
-- Author: Claude Code
-- Date: 2025-11-01
-- ============================================

-- ============================================
-- 1. AJOUT COLONNE PRORATA
-- ============================================

-- Colonne pour le prorata (2% du montant HT - frais de chantier)
ALTER TABLE factures ADD COLUMN prorata_applicable BOOLEAN DEFAULT FALSE;

-- Commentaire
COMMENT ON COLUMN factures.prorata_applicable IS 'TRUE si prorata de 2% appliqué (frais de chantier - uniquement pour factures clients)';

-- ============================================
-- 2. MODIFICATION FONCTION get_montant_a_payer
-- ============================================

-- Supprimer l'ancienne version de la fonction (avec 5 paramètres)
DROP FUNCTION IF EXISTS get_montant_a_payer(p_type TEXT, p_tva_applicable BOOLEAN, p_montant_ht DECIMAL(10,2), p_montant_ttc DECIMAL(10,2), p_retenue_garantie BOOLEAN);

-- Créer la nouvelle fonction avec le paramètre prorata_applicable
CREATE OR REPLACE FUNCTION get_montant_a_payer(
  p_type TEXT,
  p_tva_applicable BOOLEAN,
  p_montant_ht DECIMAL(10,2),
  p_montant_ttc DECIMAL(10,2),
  p_retenue_garantie BOOLEAN,
  p_prorata_applicable BOOLEAN
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  montant_base DECIMAL(10,2);
  montant_retenue DECIMAL(10,2);
  montant_prorata DECIMAL(10,2);
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

  -- Déduire la retenue de garantie si applicable (5% du HT)
  IF p_retenue_garantie THEN
    montant_retenue := p_montant_ht * 0.05;
    montant_base := montant_base - montant_retenue;
  END IF;

  -- Déduire le prorata si applicable (2% du HT)
  IF p_prorata_applicable THEN
    montant_prorata := p_montant_ht * 0.02;
    montant_base := montant_base - montant_prorata;
  END IF;

  RETURN montant_base;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_montant_a_payer IS 'Détermine le montant à payer selon le type, TVA, retenue de garantie et prorata';

-- ============================================
-- 3. MODIFICATION TRIGGER PAIEMENT
-- ============================================

-- Modifier le trigger pour inclure prorata_applicable
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
    prorata_applicable
  INTO
    facture_type,
    facture_tva_applicable,
    facture_montant_ht,
    facture_montant_ttc,
    facture_retenue_garantie,
    facture_prorata_applicable
  FROM factures
  WHERE id = facture_id_ref;

  -- Calculer le montant à payer avec la fonction helper
  montant_facture := get_montant_a_payer(
    facture_type,
    facture_tva_applicable,
    facture_montant_ht,
    facture_montant_ttc,
    facture_retenue_garantie,
    facture_prorata_applicable
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

CREATE INDEX IF NOT EXISTS idx_factures_prorata ON factures(prorata_applicable);
