-- ============================================
-- Migration 013: Ajout finalisation 95% aux chantiers et factures
-- Description: Ajout champs finalisation_95, montant_ht, montant_ttc sur chantiers + exclue_finalisation sur factures
-- Author: Claude Code
-- Date: 2025-10-31
-- ============================================

-- ============================================
-- 1. MODIFICATIONS TABLE CHANTIERS
-- ============================================

-- Ajouter colonne finalisation à 95%
ALTER TABLE chantiers ADD COLUMN finalisation_95 BOOLEAN DEFAULT FALSE;

-- Ajouter colonnes montants HT et TTC du chantier
ALTER TABLE chantiers ADD COLUMN montant_ht DECIMAL(10,2);
ALTER TABLE chantiers ADD COLUMN montant_ttc DECIMAL(10,2);

-- Commentaires
COMMENT ON COLUMN chantiers.finalisation_95 IS 'TRUE si ce chantier a une finalisation à 95% (calculée sur montant HT)';
COMMENT ON COLUMN chantiers.montant_ht IS 'Montant HT total du chantier';
COMMENT ON COLUMN chantiers.montant_ttc IS 'Montant TTC total du chantier';

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_chantiers_finalisation_95 ON chantiers(finalisation_95);

-- Contraintes de validation : montants >= 0 si renseignés
ALTER TABLE chantiers ADD CONSTRAINT valid_montant_ht_chantier
  CHECK (montant_ht IS NULL OR montant_ht >= 0);

ALTER TABLE chantiers ADD CONSTRAINT valid_montant_ttc_chantier
  CHECK (montant_ttc IS NULL OR montant_ttc >= 0);

-- ============================================
-- 2. MODIFICATIONS TABLE FACTURES
-- ============================================

-- Ajouter colonne pour exclure facture du calcul de finalisation
ALTER TABLE factures ADD COLUMN exclue_finalisation BOOLEAN DEFAULT FALSE;

-- Commentaire
COMMENT ON COLUMN factures.exclue_finalisation IS 'TRUE si cette facture est exclue du calcul de finalisation 95% du chantier (uniquement pour clients)';

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_factures_exclue_finalisation ON factures(exclue_finalisation);
