/**
 * Migration 043 - Ajouter le statut "commande_disponible"
 *
 * Ajoute le nouveau statut "commande_disponible" à la contrainte CHECK
 * de la table appartement_livraisons.
 *
 * Workflow mis à jour :
 * 1. non_commande
 * 2. commande_effectuee
 * 3. commande_disponible (NOUVEAU - commande prête chez le fournisseur)
 * 4. en_cours_livraison
 * 5. commande_sur_site
 * 6. commande_incomplete
 */

-- Supprimer l'ancienne contrainte
ALTER TABLE appartement_livraisons
DROP CONSTRAINT IF EXISTS appartement_livraisons_statut_check;

-- Ajouter la nouvelle contrainte avec le statut "commande_disponible"
ALTER TABLE appartement_livraisons
ADD CONSTRAINT appartement_livraisons_statut_check
CHECK (statut IN (
  'non_commande',
  'commande_effectuee',
  'commande_disponible',
  'en_cours_livraison',
  'commande_sur_site',
  'commande_incomplete'
));
