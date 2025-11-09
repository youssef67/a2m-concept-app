-- Migration 040: Add obligatoire column to chantier_documents_requis
-- Description: Ajouter une colonne pour marquer les documents comme obligatoires
-- Date: 2025-11-09

-- Add obligatoire column (defaults to FALSE for existing documents)
ALTER TABLE chantier_documents_requis
  ADD COLUMN IF NOT EXISTS obligatoire BOOLEAN DEFAULT FALSE;

-- Add comment
COMMENT ON COLUMN chantier_documents_requis.obligatoire IS 'Indique si le document est obligatoire pour valider un appartement';
