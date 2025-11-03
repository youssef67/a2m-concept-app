-- Migration 028: Add etage column to appartements table
-- Etage is optional (nullable) and represents the floor number (0-10)
-- 0 = Rez-de-chaussée, 1-10 = 1er étage to 10ème étage

-- Add etage column (nullable)
ALTER TABLE appartements
ADD COLUMN etage INTEGER;

-- Add check constraint: etage must be between 0 and 10 if specified
ALTER TABLE appartements
ADD CONSTRAINT valid_etage CHECK (etage IS NULL OR (etage >= 0 AND etage <= 10));

-- Create index for filtering by etage (if needed for performance)
CREATE INDEX idx_appartements_etage ON appartements(etage) WHERE etage IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN appartements.etage IS 'Étage de l''appartement (0-10). NULL si non spécifié. 0 = Rez-de-chaussée.';
