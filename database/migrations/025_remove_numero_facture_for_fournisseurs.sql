-- ============================================
-- Migration 025: Remove numero_facture for fournisseurs
-- Description: Fournisseurs don't need a numero_facture (only clients do)
-- Author: Claude Code
-- Date: 2025-11-02
-- ============================================

-- 1. Allow NULL for numero_facture (fournisseurs won't have one)
ALTER TABLE factures
ALTER COLUMN numero_facture DROP NOT NULL;

-- 2. Drop existing UNIQUE constraint
ALTER TABLE factures DROP CONSTRAINT IF EXISTS factures_numero_facture_key;

-- 3. Create partial UNIQUE index (only for non-NULL values, i.e., clients)
-- This ensures clients still have unique numero_facture
CREATE UNIQUE INDEX factures_numero_facture_unique
ON factures (numero_facture)
WHERE numero_facture IS NOT NULL;

-- 4. Set numero_facture to NULL for all existing fournisseur factures
UPDATE factures
SET numero_facture = NULL
WHERE type = 'fournisseur';

-- 5. Update trigger to only generate numero for clients
CREATE OR REPLACE FUNCTION trigger_generate_numero_facture()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate numero ONLY for clients
  IF NEW.type = 'client' THEN
    IF NEW.numero_facture IS NULL OR NEW.numero_facture = '' THEN
      NEW.numero_facture := generate_numero_facture(NEW.type);
    END IF;
  ELSE
    -- For fournisseurs, force NULL
    NEW.numero_facture := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Update comment
COMMENT ON COLUMN factures.numero_facture IS 'Numéro unique auto-généré pour les clients uniquement (NULL pour fournisseurs)';
