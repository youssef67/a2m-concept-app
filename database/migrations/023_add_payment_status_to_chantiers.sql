-- ============================================
-- Migration 023: Ajout statut paiement finalisation 95% et retenues de garantie
-- Description: Ajout colonnes finalisation_95_payee et retenue_garantie_payee sur chantiers
-- Author: Claude Code
-- Date: 2025-11-01
-- ============================================

-- ============================================
-- 1. MODIFICATIONS TABLE CHANTIERS
-- ============================================

-- Ajouter colonne pour tracker le paiement de la finalisation 95%
ALTER TABLE chantiers ADD COLUMN finalisation_95_payee BOOLEAN DEFAULT FALSE;

-- Ajouter colonne pour tracker le paiement des retenues de garantie
ALTER TABLE chantiers ADD COLUMN retenue_garantie_payee BOOLEAN DEFAULT FALSE;

-- Commentaires
COMMENT ON COLUMN chantiers.finalisation_95_payee IS 'TRUE si la finalisation à 95% a été payée au client';
COMMENT ON COLUMN chantiers.retenue_garantie_payee IS 'TRUE si les retenues de garantie ont été payées au client';

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_chantiers_finalisation_95_payee ON chantiers(finalisation_95_payee);
CREATE INDEX IF NOT EXISTS idx_chantiers_retenue_garantie_payee ON chantiers(retenue_garantie_payee);
