-- ============================================
-- Migration 008: Add chantier_id to factures
-- Description: Link factures to chantiers (required for new factures, nullable for existing)
-- Author: Claude Code
-- Date: 2025-10-31
-- ============================================

-- Add chantier_id column to factures table (nullable for migration compatibility)
ALTER TABLE factures
  ADD COLUMN chantier_id UUID REFERENCES chantiers(id) ON DELETE RESTRICT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_factures_chantier_id ON factures(chantier_id);

-- Add comment for documentation
COMMENT ON COLUMN factures.chantier_id IS 'Chantier lié à la facture (obligatoire pour nouvelles factures, nullable pour anciennes)';
