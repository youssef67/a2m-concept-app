-- ============================================
-- Migration 036: Add is_sous_traitant to contacts
-- Description: Ajouter colonne pour indiquer si un fournisseur est un sous-traitant
-- Author: Claude Code
-- Date: 2025-11-06
-- ============================================

-- ============================================
-- 1. ADD COLUMN
-- ============================================

ALTER TABLE contacts
ADD COLUMN is_sous_traitant BOOLEAN DEFAULT FALSE;

-- ============================================
-- 2. CREATE INDEX
-- ============================================

-- Index partiel pour optimiser les requêtes qui filtrent les sous-traitants
CREATE INDEX idx_contacts_is_sous_traitant ON contacts(is_sous_traitant) WHERE is_sous_traitant = TRUE;

-- ============================================
-- 3. COMMENTS (Documentation)
-- ============================================

COMMENT ON COLUMN contacts.is_sous_traitant IS 'Indique si le fournisseur est un sous-traitant (applicable uniquement aux fournisseurs)';
