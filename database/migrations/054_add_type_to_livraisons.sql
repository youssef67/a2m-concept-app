-- ============================================
-- Migration 054: Ajouter le type de livraison (principale ou plinthes)
-- Description: Permet de distinguer les livraisons principales des livraisons de plinthes
-- Author: Claude Code
-- Date: 2025-01-14
-- ============================================

-- Ajouter la colonne type
ALTER TABLE appartement_livraisons
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'principale' CHECK (
  type IN ('principale', 'plinthes')
);

-- Commentaire
COMMENT ON COLUMN appartement_livraisons.type IS
  'Type de livraison: principale (livraison générale) ou plinthes (livraison spécifique plinthes)';

-- Index pour filtrer par type
CREATE INDEX IF NOT EXISTS idx_appartement_livraisons_type
  ON appartement_livraisons(type);

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
