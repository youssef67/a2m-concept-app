/**
 * Migration 046 - Trigger de synchronisation automatique des tâches
 *
 * Objectif : Synchroniser automatiquement les tâches du chantier vers les appartements
 *
 * Fonctionnalités :
 * 1. Ajout d'une nouvelle tâche → copiée automatiquement vers tous les appartements existants
 * 2. Modification de l'intitulé ou de l'ordre → mise à jour dans tous les appartements (statuts préservés)
 * 3. Suppression d'une tâche → déjà gérée par ON DELETE CASCADE
 */

-- ========================================
-- TRIGGER 1 : Ajout d'une nouvelle tâche
-- ========================================

CREATE OR REPLACE FUNCTION sync_new_chantier_tache()
RETURNS TRIGGER AS $$
BEGIN
  -- Insérer la nouvelle tâche pour tous les appartements du chantier
  INSERT INTO appartement_taches (
    appartement_id,
    chantier_tache_id,
    intitule,
    statut,
    ordre
  )
  SELECT
    a.id as appartement_id,
    NEW.id as chantier_tache_id,
    NEW.intitule,
    'a_faire' as statut,  -- Statut initial pour les nouvelles tâches
    NEW.ordre
  FROM appartements a
  JOIN plots p ON a.plot_id = p.id
  WHERE p.chantier_id = NEW.chantier_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà (pour réexécution safe)
DROP TRIGGER IF EXISTS trigger_sync_new_chantier_tache ON chantier_taches;

CREATE TRIGGER trigger_sync_new_chantier_tache
  AFTER INSERT ON chantier_taches
  FOR EACH ROW
  EXECUTE FUNCTION sync_new_chantier_tache();


-- ========================================
-- TRIGGER 2 : Modification d'une tâche existante
-- ========================================

CREATE OR REPLACE FUNCTION sync_update_chantier_tache()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour l'intitulé et l'ordre de toutes les tâches associées
  -- SANS toucher au statut (préservation des statuts)
  UPDATE appartement_taches
  SET
    intitule = NEW.intitule,
    ordre = NEW.ordre,
    updated_at = NOW()
  WHERE chantier_tache_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà (pour réexécution safe)
DROP TRIGGER IF EXISTS trigger_sync_update_chantier_tache ON chantier_taches;

CREATE TRIGGER trigger_sync_update_chantier_tache
  AFTER UPDATE ON chantier_taches
  FOR EACH ROW
  WHEN (OLD.intitule IS DISTINCT FROM NEW.intitule OR OLD.ordre IS DISTINCT FROM NEW.ordre)
  EXECUTE FUNCTION sync_update_chantier_tache();


-- ========================================
-- NOTE : TRIGGER 3 (Suppression)
-- ========================================
-- La suppression est déjà gérée automatiquement par la contrainte
-- ON DELETE CASCADE sur la foreign key chantier_tache_id
-- Donc pas besoin de trigger explicite pour DELETE
