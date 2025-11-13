-- ============================================
-- Migration 051: Corriger le trigger create_initial_livraison pour inclure nom_livraison
-- Description: Ajouter nom_livraison au trigger qui crée la livraison initiale
-- Author: Claude Code
-- Date: 2025-01-13
-- ============================================

-- Recréer la fonction avec nom_livraison
CREATE OR REPLACE FUNCTION create_initial_livraison()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO appartement_livraisons (
    appartement_id,
    nom_livraison,
    statut,
    created_by
  ) VALUES (
    NEW.id,
    'Livraison principale',  -- Nom par défaut
    'non_commande',
    NEW.created_by
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_initial_livraison() IS
  'Initialise automatiquement le statut de livraison à "non_commande" avec nom "Livraison principale" pour chaque nouvel appartement';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
