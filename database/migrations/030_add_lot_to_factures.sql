-- Migration: Add lot column to factures table
-- Date: 2025-11-05
-- Description: Adds an optional 'lot' text field to store lot information for invoices

-- Add lot column
ALTER TABLE factures ADD COLUMN lot TEXT;

-- Add comment for documentation
COMMENT ON COLUMN factures.lot IS 'Numéro ou identifiant du lot associé à la facture';
