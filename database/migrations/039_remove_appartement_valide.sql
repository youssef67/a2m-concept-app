-- ============================================
-- Migration 039: Suppression de la colonne 'valide'
-- ============================================
-- Date: 2025-11-10
-- Description: Simplification du workflow des lots
--              en supprimant le système de validation/invalidation
-- ============================================

BEGIN;

-- Supprimer l'index sur la colonne valide (s'il existe)
DROP INDEX IF EXISTS idx_appartements_valide;

-- Supprimer la colonne valide
ALTER TABLE appartements DROP COLUMN IF EXISTS valide;

COMMIT;
