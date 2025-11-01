-- Migration 018: Create plots table
-- A plot (immeuble/structure) belongs to a chantier and contains appartements

-- Create plots table
CREATE TABLE IF NOT EXISTS plots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'immeuble' CHECK (type IN ('immeuble', 'structure', 'batiment', 'annexe', 'autre')),
  description TEXT,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_nom CHECK (LENGTH(TRIM(nom)) > 0)
);

-- Create indexes
CREATE INDEX idx_plots_chantier ON plots(chantier_id);
CREATE INDEX idx_plots_ordre ON plots(chantier_id, ordre);

-- Enable RLS
ALTER TABLE plots ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin only, same as chantiers)
CREATE POLICY "Admins can manage plots"
  ON plots FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_plots_updated_at
  BEFORE UPDATE ON plots
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
