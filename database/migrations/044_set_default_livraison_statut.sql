/**
 * Migration 044 - Définir le statut par défaut "non_commande" pour tous les lots existants
 *
 * Cette migration met à jour tous les appartements qui n'ont pas encore de livraison
 * ou qui ont une livraison sans statut défini.
 */

-- Mettre à jour tous les livraisons existantes qui ont un statut NULL avec "non_commande"
UPDATE appartement_livraisons
SET statut = 'non_commande'
WHERE statut IS NULL;

-- Définir le statut par défaut pour les futures insertions
ALTER TABLE appartement_livraisons
ALTER COLUMN statut SET DEFAULT 'non_commande';
