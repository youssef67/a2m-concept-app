-- ============================================
-- Migration 038: Add Contact Numbering (Clients & Fournisseurs)
-- Description: Add automatic contact numbering with format C-XXXXXX and F-XXXXXX
-- Author: Claude Code
-- Date: 2025-11-19
-- ============================================

-- ============================================
-- 1. ADD COLUMN numero_contact
-- ============================================

ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS numero_contact TEXT UNIQUE;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_numero ON contacts(numero_contact);

-- ============================================
-- 2. FUNCTION: Generate Numero Contact
-- ============================================

CREATE OR REPLACE FUNCTION generate_numero_contact(contact_type TEXT)
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  last_number INT;
  new_number TEXT;
BEGIN
  -- Déterminer le préfixe selon le type
  IF contact_type = 'client' THEN
    prefix := 'C-';
  ELSE
    prefix := 'F-';
  END IF;

  -- Trouver le dernier numéro pour ce type
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(numero_contact FROM '[0-9]+$') AS INT)
  ), 0) INTO last_number
  FROM contacts
  WHERE type = contact_type
    AND numero_contact LIKE prefix || '%';

  -- Générer le nouveau numéro (format: C-000001 ou F-000001)
  new_number := prefix || LPAD((last_number + 1)::TEXT, 6, '0');

  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. TRIGGER: Auto-generate numero_contact
-- ============================================

CREATE OR REPLACE FUNCTION trigger_generate_numero_contact()
RETURNS TRIGGER AS $$
BEGIN
  -- Générer le numéro si NULL ou vide
  IF NEW.numero_contact IS NULL OR NEW.numero_contact = '' THEN
    NEW.numero_contact := generate_numero_contact(NEW.type);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_numero_contact ON contacts;
CREATE TRIGGER set_numero_contact
  BEFORE INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_numero_contact();

-- ============================================
-- 4. MIGRATE EXISTING CONTACTS
-- ============================================

-- Attribuer des numéros aux clients existants (triés par date de création)
WITH numbered_clients AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
  FROM contacts
  WHERE type = 'client'
    AND numero_contact IS NULL
)
UPDATE contacts
SET numero_contact = 'C-' || LPAD(numbered_clients.row_num::TEXT, 6, '0')
FROM numbered_clients
WHERE contacts.id = numbered_clients.id;

-- Attribuer des numéros aux fournisseurs existants (triés par date de création)
WITH numbered_fournisseurs AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
  FROM contacts
  WHERE type = 'fournisseur'
    AND numero_contact IS NULL
)
UPDATE contacts
SET numero_contact = 'F-' || LPAD(numbered_fournisseurs.row_num::TEXT, 6, '0')
FROM numbered_fournisseurs
WHERE contacts.id = numbered_fournisseurs.id;

-- ============================================
-- 5. SET NOT NULL CONSTRAINT (after migration)
-- ============================================

-- Maintenant que tous les contacts existants ont un numéro, on rend la colonne NOT NULL
ALTER TABLE contacts
ALTER COLUMN numero_contact SET NOT NULL;

-- ============================================
-- 6. COMMENTS (Documentation)
-- ============================================

COMMENT ON COLUMN contacts.numero_contact IS 'Numéro unique auto-généré (C-XXXXXX pour clients, F-XXXXXX pour fournisseurs)';
COMMENT ON FUNCTION generate_numero_contact(TEXT) IS 'Génère le prochain numéro de contact selon le type (client ou fournisseur)';
