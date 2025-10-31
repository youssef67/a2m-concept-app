-- ============================================
-- Migration 006: Add 'cloture' status to chantiers
-- Description: Modify CHECK constraint to add 'cloture' status
-- Author: Claude Code
-- Date: 2025-10-31
-- ============================================

-- Drop the existing constraint
ALTER TABLE chantiers
  DROP CONSTRAINT IF EXISTS chantiers_statut_check;

-- Add the new constraint with 'cloture' status
ALTER TABLE chantiers
  ADD CONSTRAINT chantiers_statut_check
  CHECK (statut IN ('en_cours', 'planifie', 'devis', 'cloture'));

-- Update comment for documentation
COMMENT ON COLUMN chantiers.statut IS 'Statut: en_cours, planifie, devis, or cloture';
