-- ============================================
-- Migration 010: Ajout délai de paiement aux contacts
-- Description: Ajouter colonne delai_paiement à la table contacts
-- Author: Claude Code
-- Date: 2025-10-31
-- ============================================

-- Ajouter la colonne delai_paiement avec contrainte CHECK et valeur par défaut
ALTER TABLE contacts
ADD COLUMN delai_paiement TEXT DEFAULT 'immediat'
CHECK (delai_paiement IN ('immediat', '30_jours', '45_jours', '60_jours'));

-- Ajouter un commentaire pour documentation
COMMENT ON COLUMN contacts.delai_paiement IS 'Délai de paiement : immediat (défaut), 30_jours, 45_jours, ou 60_jours';

-- Index pour améliorer les requêtes filtrées par délai
CREATE INDEX IF NOT EXISTS idx_contacts_delai_paiement ON contacts(delai_paiement);
