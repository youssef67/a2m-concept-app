-- Migration: Ajouter support multi-pièces pour plinthes
-- Date: 2025-11-14
-- Description: Permet de gérer plusieurs configurations de plinthes par appartement (séjour, salle de bains, etc.)

-- 1. Ajouter champ "piece" pour identifier la pièce
ALTER TABLE appartement_plinthes
ADD COLUMN IF NOT EXISTS piece TEXT NOT NULL DEFAULT 'Général';

-- 2. Supprimer contrainte UNIQUE sur appartement_id seul
ALTER TABLE appartement_plinthes
DROP CONSTRAINT IF EXISTS appartement_plinthes_appartement_id_key;

-- 3. Ajouter contrainte UNIQUE composée (appartement_id, piece)
-- Cela permet plusieurs plinthes par appartement, mais une seule par pièce
ALTER TABLE appartement_plinthes
ADD CONSTRAINT appartement_plinthes_appartement_piece_unique
UNIQUE (appartement_id, piece);

-- 4. Index pour améliorer les performances de recherche par pièce
CREATE INDEX IF NOT EXISTS idx_appartement_plinthes_piece ON appartement_plinthes(piece);

-- Note: Les données existantes auront automatiquement piece='Général' grâce au DEFAULT
