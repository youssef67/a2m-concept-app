-- ============================================
-- Migration 031: Make chantier address optional
-- Description: Remove NOT NULL constraints, drop adresse_ligne2, clean legacy data
-- Author: Claude Code
-- Date: 2025-11-05
-- ============================================

-- ============================================
-- 1. CLEAN LEGACY DATA
-- ============================================

-- Nettoyer les données "non renseigné" et "0000" en les mettant à NULL
UPDATE chantiers
SET adresse_ligne1 = NULL
WHERE LOWER(TRIM(adresse_ligne1)) = 'non renseigné' OR LOWER(TRIM(adresse_ligne1)) = 'non renseigne';

UPDATE chantiers
SET ville = NULL
WHERE LOWER(TRIM(ville)) = 'non renseigné' OR LOWER(TRIM(ville)) = 'non renseigne';

UPDATE chantiers
SET code_postal = NULL
WHERE code_postal = '0000' OR LOWER(TRIM(code_postal)) = 'non renseigné' OR LOWER(TRIM(code_postal)) = 'non renseigne';

-- ============================================
-- 2. DROP adresse_ligne2 COLUMN
-- ============================================

-- Supprimer complètement la colonne adresse_ligne2
ALTER TABLE chantiers DROP COLUMN IF EXISTS adresse_ligne2;

-- ============================================
-- 3. MAKE ADDRESS FIELDS OPTIONAL
-- ============================================

-- Rendre les champs d'adresse optionnels
ALTER TABLE chantiers ALTER COLUMN adresse_ligne1 DROP NOT NULL;
ALTER TABLE chantiers ALTER COLUMN ville DROP NOT NULL;
ALTER TABLE chantiers ALTER COLUMN code_postal DROP NOT NULL;

-- ============================================
-- 4. UPDATE COMMENTS
-- ============================================

-- Mettre à jour les commentaires
COMMENT ON COLUMN chantiers.adresse_ligne1 IS 'Adresse du chantier (ligne 1) - Optionnel';
COMMENT ON COLUMN chantiers.ville IS 'Ville du chantier - Optionnel';
COMMENT ON COLUMN chantiers.code_postal IS 'Code postal du chantier - Optionnel';
