-- ============================================
-- Migration 049: Support multiple livraisons par appartement
-- Description: Supprimer contrainte UNIQUE sur appartement_id et ajouter nom_livraison
-- Author: Claude Code
-- Date: 2025-01-13
-- ============================================

-- ============================================
-- 1. AJOUTER COLONNE NOM_LIVRAISON
-- ============================================

-- Ajouter la colonne avec une valeur par défaut temporaire
ALTER TABLE appartement_livraisons
ADD COLUMN IF NOT EXISTS nom_livraison VARCHAR(100) DEFAULT 'Livraison principale';

-- Mettre à jour les livraisons existantes avec un nom basé sur le fournisseur ou un nom par défaut
UPDATE appartement_livraisons
SET nom_livraison = COALESCE(
  NULLIF(fournisseur, ''),
  'Livraison principale'
)
WHERE nom_livraison = 'Livraison principale';

-- Rendre la colonne NOT NULL
ALTER TABLE appartement_livraisons
ALTER COLUMN nom_livraison SET NOT NULL;

-- Supprimer la valeur par défaut pour forcer à spécifier un nom lors de la création
ALTER TABLE appartement_livraisons
ALTER COLUMN nom_livraison DROP DEFAULT;

-- ============================================
-- 2. SUPPRIMER LA CONTRAINTE UNIQUE
-- ============================================

-- Trouver et supprimer la contrainte UNIQUE sur appartement_id
-- PostgreSQL génère automatiquement un nom pour les contraintes UNIQUE inline
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Récupérer le nom de la contrainte UNIQUE sur appartement_id
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'appartement_livraisons'::regclass
    AND contype = 'u'
    AND array_length(conkey, 1) = 1
    AND conkey[1] = (
      SELECT attnum
      FROM pg_attribute
      WHERE attrelid = 'appartement_livraisons'::regclass
        AND attname = 'appartement_id'
    );

  -- Supprimer la contrainte si elle existe
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE appartement_livraisons DROP CONSTRAINT %I', constraint_name);
    RAISE NOTICE 'Contrainte UNIQUE % supprimée avec succès', constraint_name;
  ELSE
    RAISE NOTICE 'Aucune contrainte UNIQUE trouvée sur appartement_id';
  END IF;
END $$;

-- ============================================
-- 3. AJOUTER INDEX SUR APPARTEMENT_ID
-- ============================================

-- Créer un index non-unique sur appartement_id pour les performances
-- (remplace l'index unique qui existait via la contrainte)
CREATE INDEX IF NOT EXISTS idx_appartement_livraisons_appartement_id_multi
ON appartement_livraisons(appartement_id);

-- ============================================
-- 4. COMMENTAIRES
-- ============================================

COMMENT ON COLUMN appartement_livraisons.nom_livraison IS 'Nom descriptif de la livraison (ex: "Cuisine IKEA", "Carrelage Leroy Merlin"). Permet de distinguer plusieurs livraisons pour un même appartement.';

-- ============================================
-- 5. VÉRIFICATION
-- ============================================

-- Afficher le nombre de livraisons par appartement
DO $$
DECLARE
  max_livraisons INTEGER;
  total_appartements_multi INTEGER;
BEGIN
  SELECT MAX(count), COUNT(*)
  INTO max_livraisons, total_appartements_multi
  FROM (
    SELECT appartement_id, COUNT(*) as count
    FROM appartement_livraisons
    GROUP BY appartement_id
    HAVING COUNT(*) > 1
  ) subquery;

  RAISE NOTICE 'Migration 049 terminée avec succès';
  RAISE NOTICE 'Maximum de livraisons par appartement: %', COALESCE(max_livraisons, 1);
  RAISE NOTICE 'Nombre d''appartements avec plusieurs livraisons: %', COALESCE(total_appartements_multi, 0);
END $$;
