-- Migration: Ajouter la colonne nombre_etages à la table plots
-- Description: Permet de définir un nombre d'étages personnalisé pour chaque plot
-- Author: Claude Code
-- Date: 2025-01-13

-- Ajouter la colonne nombre_etages avec une valeur par défaut de 10
-- (préserve le comportement actuel pour les plots existants)
ALTER TABLE plots
ADD COLUMN nombre_etages INTEGER NOT NULL DEFAULT 10;

-- Ajouter une contrainte pour valider que le nombre d'étages est entre 1 et 15
ALTER TABLE plots
ADD CONSTRAINT plots_nombre_etages_range CHECK (nombre_etages >= 1 AND nombre_etages <= 15);

-- Commentaire sur la colonne
COMMENT ON COLUMN plots.nombre_etages IS 'Nombre d''étages du plot (1-15). Par défaut: 10 étages.';
