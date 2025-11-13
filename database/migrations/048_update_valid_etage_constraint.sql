-- Migration: Mettre à jour la contrainte valid_etage pour permettre jusqu'à 15 étages
-- Description: Augmente la limite d'étages de 10 à 15 pour correspondre au nombre_etages configurable des plots
-- Author: Claude Code
-- Date: 2025-01-13

-- Supprimer l'ancienne contrainte (0-10)
ALTER TABLE appartements
DROP CONSTRAINT IF EXISTS valid_etage;

-- Ajouter la nouvelle contrainte (0-15)
ALTER TABLE appartements
ADD CONSTRAINT valid_etage CHECK (etage IS NULL OR (etage >= 0 AND etage <= 15));

-- Commentaire sur la contrainte
COMMENT ON CONSTRAINT valid_etage ON appartements IS 'L''étage doit être entre 0 (RDC) et 15, ou NULL si non spécifié. Correspond au nombre_etages maximum des plots.';
