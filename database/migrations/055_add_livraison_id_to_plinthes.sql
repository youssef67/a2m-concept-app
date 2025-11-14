-- ============================================
-- Migration 055: Lier les plinthes à une livraison
-- Description: Ajouter une référence vers la livraison de plinthes
-- Author: Claude Code
-- Date: 2025-01-14
-- ============================================

-- Ajouter la colonne livraison_id
ALTER TABLE appartement_plinthes
ADD COLUMN IF NOT EXISTS livraison_id UUID NULL REFERENCES appartement_livraisons(id) ON DELETE SET NULL;

-- Commentaire
COMMENT ON COLUMN appartement_plinthes.livraison_id IS
  'Référence vers la livraison de plinthes associée (type = plinthes)';

-- Index
CREATE INDEX IF NOT EXISTS idx_appartement_plinthes_livraison_id
  ON appartement_plinthes(livraison_id);

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
