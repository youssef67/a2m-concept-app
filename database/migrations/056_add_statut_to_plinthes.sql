-- Migration: Ajouter le champ statut à la table appartement_plinthes
-- Date: 2025-01-14
-- Description: Permet de suivre l'état de la commande des plinthes (non commandé, commandé, en livraison, sur site)

-- Ajouter la colonne statut avec une valeur par défaut
ALTER TABLE appartement_plinthes
ADD COLUMN IF NOT EXISTS statut TEXT NOT NULL DEFAULT 'non_commande'
CHECK (statut IN (
  'non_commande',
  'commande_effectuee',
  'en_cours_livraison',
  'sur_site'
));

-- Ajouter des colonnes pour les dates de livraison
ALTER TABLE appartement_plinthes
ADD COLUMN IF NOT EXISTS date_livraison_prevue DATE,
ADD COLUMN IF NOT EXISTS date_reception DATE;

-- Créer un index sur le statut pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_appartement_plinthes_statut ON appartement_plinthes(statut);

-- Mise à jour des enregistrements existants:
-- Si est_commande = true, passer le statut à 'commande_effectuee'
UPDATE appartement_plinthes
SET statut = 'commande_effectuee'
WHERE est_commande = true AND statut = 'non_commande';
