-- ============================================
-- Migration 038: Add has_tma flag to appartements
-- Description: Ajouter un flag pour indiquer si un appartement a une TMA (Travaux Modificatifs Acquéreur)
-- Author: Claude Code
-- Date: 2025-11-07
-- ============================================

-- ============================================
-- 1. ADD COLUMN
-- ============================================

ALTER TABLE appartements
ADD COLUMN IF NOT EXISTS has_tma BOOLEAN DEFAULT FALSE;

-- ============================================
-- 2. CREATE INDEX
-- ============================================

-- Index partiel pour optimiser les recherches d'appartements avec TMA
CREATE INDEX IF NOT EXISTS idx_appartements_has_tma
ON appartements(has_tma)
WHERE has_tma = TRUE;

-- ============================================
-- 3. COMMENTS (Documentation)
-- ============================================

COMMENT ON COLUMN appartements.has_tma IS 'Indique si l''appartement a une TMA (Travaux Modificatifs Acquéreur)';
