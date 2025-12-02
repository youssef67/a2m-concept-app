-- ============================================
-- Migration: Rendre phone et email optionnels pour contact_persons
-- Date: 2025-12-02
-- Description: Permet d'ajouter une personne de contact avec seulement nom et prénom
-- ============================================

-- Supprimer la contrainte NOT NULL sur phone
ALTER TABLE contact_persons ALTER COLUMN phone DROP NOT NULL;

-- Supprimer la contrainte NOT NULL sur email
ALTER TABLE contact_persons ALTER COLUMN email DROP NOT NULL;

-- Mise à jour des commentaires
COMMENT ON COLUMN contact_persons.phone IS 'Phone number (optional)';
COMMENT ON COLUMN contact_persons.email IS 'Email address (optional)';
