-- Migration 021: Create chantier_documents_requis table
-- Description: Table pour gérer la liste des documents requis par chantier (noms uniquement)
-- Date: 2025-11-01

-- Create chantier_documents_requis table
CREATE TABLE IF NOT EXISTS chantier_documents_requis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  nom_document TEXT NOT NULL,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_nom_document CHECK (LENGTH(TRIM(nom_document)) > 0)
);

-- Create indexes for performance
CREATE INDEX idx_chantier_documents_requis_chantier_id ON chantier_documents_requis(chantier_id);
CREATE INDEX idx_chantier_documents_requis_ordre ON chantier_documents_requis(chantier_id, ordre);

-- Enable RLS
ALTER TABLE chantier_documents_requis ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Only admins can manage documents requis
CREATE POLICY "Admins can manage documents requis" ON chantier_documents_requis
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Create trigger for updated_at
CREATE TRIGGER on_document_requis_updated
  BEFORE UPDATE ON chantier_documents_requis
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add comment on table
COMMENT ON TABLE chantier_documents_requis IS 'Liste des documents requis pour chaque chantier (noms uniquement, pas de fichiers)';
COMMENT ON COLUMN chantier_documents_requis.nom_document IS 'Nom du document requis';
COMMENT ON COLUMN chantier_documents_requis.ordre IS 'Ordre d''affichage (basé sur l''ordre d''ajout)';
