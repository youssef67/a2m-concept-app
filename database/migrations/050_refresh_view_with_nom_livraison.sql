-- ============================================
-- Migration 050: Recréer la vue appartement_livraisons_with_retard avec nom_livraison
-- Description: La vue utilisait SELECT * qui a été figée avant l'ajout de nom_livraison
-- Author: Claude Code
-- Date: 2025-01-13
-- ============================================

-- Supprimer l'ancienne vue
DROP VIEW IF EXISTS appartement_livraisons_with_retard;

-- Recréer la vue avec la colonne nom_livraison
CREATE OR REPLACE VIEW appartement_livraisons_with_retard AS
SELECT
  l.id,
  l.appartement_id,
  l.nom_livraison,
  l.statut,
  l.date_commande,
  l.fournisseur,
  l.numero_commande,
  l.date_livraison_prevue,
  l.date_reception,
  l.note_incomplete,
  l.created_by,
  l.created_at,
  l.updated_at,
  CASE
    WHEN l.statut = 'en_cours_livraison'
         AND l.date_livraison_prevue IS NOT NULL
         AND l.date_livraison_prevue < CURRENT_DATE
    THEN CURRENT_DATE - l.date_livraison_prevue
    ELSE 0
  END AS jours_retard
FROM appartement_livraisons l;

COMMENT ON VIEW appartement_livraisons_with_retard IS
  'Vue avec calcul automatique des jours de retard pour livraisons en cours (inclut nom_livraison)';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
