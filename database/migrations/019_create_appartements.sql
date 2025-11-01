-- Migration 019: Create appartements table
-- An appartement belongs to a plot and inherits tasks from the chantier

-- Create appartements table
CREATE TABLE IF NOT EXISTS appartements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_nom CHECK (LENGTH(TRIM(nom)) > 0)
);

-- Create indexes
CREATE INDEX idx_appartements_plot ON appartements(plot_id);
CREATE INDEX idx_appartements_ordre ON appartements(plot_id, ordre);

-- Enable RLS
ALTER TABLE appartements ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin only, same as chantiers)
CREATE POLICY "Admins can manage appartements"
  ON appartements FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_appartements_updated_at
  BEFORE UPDATE ON appartements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
