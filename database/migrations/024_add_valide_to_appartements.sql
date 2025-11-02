-- Migration 024: Add valide column to appartements
-- Allows manual validation of appartements

-- Add valide column (default FALSE for all appartements)
ALTER TABLE appartements
ADD COLUMN valide BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for filtering
CREATE INDEX idx_appartements_valide ON appartements(valide);

-- IMPORTANT: No automatic migration of existing data
-- All appartements start with valide = FALSE
-- Admin must manually validate appartements to move them to "Prêt" tab
