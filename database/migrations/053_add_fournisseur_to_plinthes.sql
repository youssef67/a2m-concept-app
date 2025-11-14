-- ============================================
-- Migration 053: Ajouter le champ fournisseur aux plinthes
-- Description: Permet d'indiquer chez qui les plinthes ont été commandées
-- Author: Claude Code
-- Date: 2025-01-14
-- ============================================

-- Ajouter la colonne fournisseur
ALTER TABLE appartement_plinthes
ADD COLUMN IF NOT EXISTS fournisseur TEXT NULL;

-- Commentaire
COMMENT ON COLUMN appartement_plinthes.fournisseur IS
  'Nom du fournisseur/magasin où les plinthes ont été commandées';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
