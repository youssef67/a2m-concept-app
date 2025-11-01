-- Migration 020: Create appartement_taches table
-- Tasks inherited from chantier_taches for each appartement

-- Create appartement_taches table
CREATE TABLE IF NOT EXISTS appartement_taches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appartement_id UUID NOT NULL REFERENCES appartements(id) ON DELETE CASCADE,
  chantier_tache_id UUID NOT NULL REFERENCES chantier_taches(id) ON DELETE CASCADE,
  intitule TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'a_faire' CHECK (statut IN ('a_faire', 'en_cours', 'terminee')),
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_intitule CHECK (LENGTH(TRIM(intitule)) > 0)
);

-- Create indexes
CREATE INDEX idx_appartement_taches_appartement ON appartement_taches(appartement_id);
CREATE INDEX idx_appartement_taches_chantier_tache ON appartement_taches(chantier_tache_id);
CREATE INDEX idx_appartement_taches_ordre ON appartement_taches(appartement_id, ordre);

-- Enable RLS
ALTER TABLE appartement_taches ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin only, same as chantiers)
CREATE POLICY "Admins can manage appartement tasks"
  ON appartement_taches FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_appartement_taches_updated_at
  BEFORE UPDATE ON appartement_taches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
