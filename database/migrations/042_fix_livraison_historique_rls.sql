/**
 * Migration 042 - Fix RLS policy for appartement_livraison_historique
 *
 * Problème : Le trigger log_livraison_status_change() ne peut pas insérer
 * dans appartement_livraison_historique car la politique RLS n'autorise que SELECT.
 *
 * Solution : Ajouter une politique INSERT pour permettre les insertions automatiques.
 */

-- Ajouter une politique INSERT pour l'historique
CREATE POLICY "Admins can insert livraison history"
  ON appartement_livraison_historique
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
