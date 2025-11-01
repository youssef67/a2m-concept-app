-- Migration 017: Create chantier_taches table
-- Description: Table pour gérer les tâches communes à tous les plots d'un chantier
-- Date: 2025-11-01

-- Create chantier_taches table
CREATE TABLE IF NOT EXISTS chantier_taches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  intitule TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'a_faire' CHECK (statut IN ('a_faire', 'en_cours', 'terminee')),
  ordre INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_intitule CHECK (LENGTH(TRIM(intitule)) > 0)
);

-- Create indexes for performance
CREATE INDEX idx_chantier_taches_chantier_id ON chantier_taches(chantier_id);
CREATE INDEX idx_chantier_taches_ordre ON chantier_taches(chantier_id, ordre);

-- Enable RLS
ALTER TABLE chantier_taches ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Only admins can manage taches
CREATE POLICY "Admins can manage taches" ON chantier_taches
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Create trigger for updated_at
CREATE TRIGGER on_tache_updated
  BEFORE UPDATE ON chantier_taches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add comment on table
COMMENT ON TABLE chantier_taches IS 'Tâches communes à tous les plots d''un chantier';
COMMENT ON COLUMN chantier_taches.intitule IS 'Libellé de la tâche';
COMMENT ON COLUMN chantier_taches.statut IS 'Statut de la tâche: a_faire, en_cours, terminee';
COMMENT ON COLUMN chantier_taches.ordre IS 'Ordre d''affichage (basé sur l''ordre d''ajout)';
