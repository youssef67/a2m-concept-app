/**
 * Migration 045 - Synchronisation des tâches pour STARLETTE 2
 *
 * Problème : Les 23 appartements du chantier STARLETTE 2 n'ont aucune tâche
 * alors que le chantier a 11 tâches définies.
 *
 * Solution : Copier toutes les tâches du chantier vers tous les appartements.
 */

-- Insérer les tâches pour tous les appartements de STARLETTE 2
INSERT INTO appartement_taches (
  appartement_id,
  chantier_tache_id,
  intitule,
  statut,
  ordre
)
SELECT
  a.id as appartement_id,
  ct.id as chantier_tache_id,
  ct.intitule,
  'a_faire' as statut,  -- Statut initial
  ct.ordre
FROM appartements a
JOIN plots p ON a.plot_id = p.id
CROSS JOIN chantier_taches ct
WHERE p.chantier_id = 'af3eea86-3ad1-40f8-94f5-40aeb0d13c2b'  -- STARLETTE 2
  AND ct.chantier_id = 'af3eea86-3ad1-40f8-94f5-40aeb0d13c2b'
  AND NOT EXISTS (
    -- Éviter les doublons si la migration est exécutée plusieurs fois
    SELECT 1 FROM appartement_taches at
    WHERE at.appartement_id = a.id
      AND at.chantier_tache_id = ct.id
  );
