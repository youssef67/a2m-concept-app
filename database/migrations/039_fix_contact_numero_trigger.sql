-- ============================================
-- Migration 039: Fix Contact Numero Trigger (Ambiguous Column Reference)
-- Description: Fix PostgreSQL error 42702 - rename function parameter to avoid ambiguity
-- Author: Claude Code
-- Date: 2025-11-20
-- ============================================

-- ============================================
-- FIX: Recreate function with unambiguous parameter name
-- ============================================

-- Drop existing function first
DROP FUNCTION IF EXISTS generate_numero_contact(TEXT);

CREATE OR REPLACE FUNCTION generate_numero_contact(p_type TEXT)
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  last_number INT;
  new_number TEXT;
BEGIN
  -- Déterminer le préfixe selon le type
  IF p_type = 'client' THEN
    prefix := 'C-';
  ELSE
    prefix := 'F-';
  END IF;

  -- Trouver le dernier numéro pour ce type
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(numero_contact FROM '[0-9]+$') AS INT)
  ), 0) INTO last_number
  FROM contacts
  WHERE type = p_type
    AND numero_contact LIKE prefix || '%';

  -- Générer le nouveau numéro (format: C-000001 ou F-000001)
  new_number := prefix || LPAD((last_number + 1)::TEXT, 6, '0');

  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENT
-- ============================================

COMMENT ON FUNCTION generate_numero_contact(TEXT) IS 'Génère le prochain numéro de contact selon le type (client ou fournisseur) - Fixed ambiguous column reference';
