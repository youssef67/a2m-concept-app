-- ============================================
-- Migration: Ajouter champ is_important aux notes
-- Date: 2025-12-02
-- Description: Permet de marquer une note comme importante (action requise)
-- ============================================

-- 1. Ajouter colonne is_important
ALTER TABLE facture_notes ADD COLUMN IF NOT EXISTS is_important BOOLEAN DEFAULT FALSE;

-- 2. Index partiel pour améliorer les performances des filtres sur notes importantes
CREATE INDEX IF NOT EXISTS idx_facture_notes_is_important ON facture_notes(facture_id) WHERE is_important = TRUE;

-- 3. Commentaire
COMMENT ON COLUMN facture_notes.is_important IS 'Indique si la note nécessite une action';
