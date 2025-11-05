-- ============================================
-- Migration 033: Ajout exclusion factures de tous les calculs
-- Description: Ajouter colonnes exclue_calculs et raison_exclusion pour exclure une facture de tous les calculs (dashboard, totaux, statistiques)
-- Author: Claude Code
-- Date: 2025-11-05
-- ============================================

-- ============================================
-- 1. AJOUT COLONNES EXCLUSION
-- ============================================

-- Ajouter colonne pour exclure facture de TOUS les calculs
ALTER TABLE factures ADD COLUMN exclue_calculs BOOLEAN DEFAULT FALSE NOT NULL;

-- Ajouter colonne pour la raison de l'exclusion
ALTER TABLE factures ADD COLUMN raison_exclusion TEXT;

-- ============================================
-- 2. COMMENTAIRES
-- ============================================

COMMENT ON COLUMN factures.exclue_calculs IS 'TRUE si cette facture est exclue de tous les calculs (dashboard, totaux, statistiques) - son montant est ignoré';
COMMENT ON COLUMN factures.raison_exclusion IS 'Raison pour laquelle la facture est exclue des calculs (obligatoire si exclue_calculs = TRUE)';

-- ============================================
-- 3. INDEX POUR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_factures_exclue_calculs ON factures(exclue_calculs) WHERE exclue_calculs = TRUE;

-- ============================================
-- 4. CONTRAINTE DE VALIDATION
-- ============================================

-- Si exclue_calculs = TRUE, raison_exclusion doit être remplie
ALTER TABLE factures ADD CONSTRAINT check_raison_exclusion
  CHECK (
    (exclue_calculs = FALSE AND raison_exclusion IS NULL) OR
    (exclue_calculs = TRUE AND raison_exclusion IS NOT NULL AND TRIM(raison_exclusion) != '')
  );
