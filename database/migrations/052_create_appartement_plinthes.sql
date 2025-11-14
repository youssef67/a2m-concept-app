-- ============================================
-- Migration 052: Système de gestion des plinthes pour appartements
-- Description: Gestion des quantités de plinthes (ML), références et commandes
-- Author: Claude Code
-- Date: 2025-01-14
-- ============================================

-- ============================================
-- TABLE: APPARTEMENT_PLINTHES
-- ============================================

CREATE TABLE IF NOT EXISTS appartement_plinthes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relation (un appartement = une configuration plinthes)
  appartement_id UUID NOT NULL UNIQUE REFERENCES appartements(id) ON DELETE CASCADE,

  -- Données plinthes
  quantite_ml DECIMAL(10,2) NULL CHECK (quantite_ml IS NULL OR quantite_ml >= 0),
  reference TEXT NULL,
  est_commande BOOLEAN DEFAULT false,
  date_commande DATE NULL,

  -- Métadonnées
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_appartement_plinthes_appartement_id
  ON appartement_plinthes(appartement_id);

-- Commentaires
COMMENT ON TABLE appartement_plinthes IS
  'Gestion des plinthes pour chaque appartement: quantité en mètres linéaires, référence, statut commande';
COMMENT ON COLUMN appartement_plinthes.quantite_ml IS
  'Quantité de plinthes en mètres linéaires';
COMMENT ON COLUMN appartement_plinthes.reference IS
  'Référence produit des plinthes';
COMMENT ON COLUMN appartement_plinthes.est_commande IS
  'Indique si les plinthes ont été commandées';
COMMENT ON COLUMN appartement_plinthes.date_commande IS
  'Date de commande des plinthes (si commandées)';

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE appartement_plinthes ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : tous les utilisateurs authentifiés
CREATE POLICY "Permettre lecture plinthes pour utilisateurs authentifiés"
  ON appartement_plinthes
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique d'insertion : utilisateurs authentifiés
CREATE POLICY "Permettre insertion plinthes pour utilisateurs authentifiés"
  ON appartement_plinthes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Politique de mise à jour : utilisateurs authentifiés
CREATE POLICY "Permettre mise à jour plinthes pour utilisateurs authentifiés"
  ON appartement_plinthes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Politique de suppression : utilisateurs authentifiés
CREATE POLICY "Permettre suppression plinthes pour utilisateurs authentifiés"
  ON appartement_plinthes
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
