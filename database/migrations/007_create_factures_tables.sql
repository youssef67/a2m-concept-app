-- ============================================
-- Migration 007: Finances System (Factures)
-- Description: Create factures and facture_documents tables with auto-numbering
-- Author: Claude Code
-- Date: 2025-10-30
-- ============================================

-- ============================================
-- 1. FACTURES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Type et relation
  type TEXT NOT NULL CHECK (type IN ('client', 'fournisseur')),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,

  -- Numéro de facture (généré automatiquement)
  -- Format: FAC/C-YYYY-NNNNN ou FAC/F-YYYY-NNNNN
  numero_facture TEXT UNIQUE NOT NULL,

  -- Statut de la facture
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'payee', 'annulee')),

  -- Montants (EUR uniquement)
  montant DECIMAL(10,2) NOT NULL CHECK (montant > 0),

  -- Dates
  date_emission DATE NOT NULL,
  date_echeance DATE NOT NULL,

  -- Notes
  notes TEXT,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT valid_dates CHECK (date_echeance >= date_emission)
);

-- ============================================
-- 2. INDEXES FOR FACTURES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_factures_type ON factures(type);
CREATE INDEX IF NOT EXISTS idx_factures_contact_id ON factures(contact_id);
CREATE INDEX IF NOT EXISTS idx_factures_numero ON factures(numero_facture);
CREATE INDEX IF NOT EXISTS idx_factures_statut ON factures(statut);
CREATE INDEX IF NOT EXISTS idx_factures_date_emission ON factures(date_emission DESC);
CREATE INDEX IF NOT EXISTS idx_factures_date_echeance ON factures(date_echeance);
CREATE INDEX IF NOT EXISTS idx_factures_created_by ON factures(created_by);

-- ============================================
-- 3. FACTURE_DOCUMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS facture_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relation facture (cascade delete)
  facture_id UUID NOT NULL REFERENCES factures(id) ON DELETE CASCADE,

  -- Informations fichier
  nom_fichier TEXT NOT NULL,
  nom_original TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  taille_fichier BIGINT NOT NULL,
  type_mime TEXT NOT NULL DEFAULT 'application/pdf',

  -- Métadonnées
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contraintes de validation
  CONSTRAINT valid_file_size
    CHECK (taille_fichier > 0 AND taille_fichier <= 10485760),
  CONSTRAINT valid_mime_type
    CHECK (type_mime = 'application/pdf')
);

-- ============================================
-- 4. INDEXES FOR FACTURE_DOCUMENTS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_facture_documents_facture_id
  ON facture_documents(facture_id);

CREATE INDEX IF NOT EXISTS idx_facture_documents_created_at
  ON facture_documents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_facture_documents_storage_path
  ON facture_documents(storage_path);

-- ============================================
-- 5. FUNCTION: Generate Numero Facture
-- ============================================

CREATE OR REPLACE FUNCTION generate_numero_facture(facture_type TEXT)
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  year TEXT;
  last_number INT;
  new_number TEXT;
BEGIN
  -- Déterminer le préfixe selon le type
  IF facture_type = 'client' THEN
    prefix := 'FAC/C-';
  ELSE
    prefix := 'FAC/F-';
  END IF;

  -- Année en cours
  year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

  -- Trouver le dernier numéro pour ce type et cette année
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(numero_facture FROM '[0-9]+$') AS INT)
  ), 0) INTO last_number
  FROM factures
  WHERE type = facture_type
    AND numero_facture LIKE prefix || year || '-%';

  -- Générer le nouveau numéro (format: FAC/C-2025-00001)
  new_number := prefix || year || '-' || LPAD((last_number + 1)::TEXT, 5, '0');

  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. TRIGGER: Auto-generate numero_facture
-- ============================================

CREATE OR REPLACE FUNCTION trigger_generate_numero_facture()
RETURNS TRIGGER AS $$
BEGIN
  -- Générer le numéro si vide ou NULL
  IF NEW.numero_facture IS NULL OR NEW.numero_facture = '' THEN
    NEW.numero_facture := generate_numero_facture(NEW.type);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_numero_facture ON factures;
CREATE TRIGGER set_numero_facture
  BEFORE INSERT ON factures
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_numero_facture();

-- ============================================
-- 7. TRIGGER: Auto-update updated_at
-- ============================================

-- Reuse existing handle_updated_at() function
DROP TRIGGER IF EXISTS on_facture_updated ON factures;
CREATE TRIGGER on_facture_updated
  BEFORE UPDATE ON factures
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_facture_document_updated ON facture_documents;
CREATE TRIGGER on_facture_document_updated
  BEFORE UPDATE ON facture_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE facture_documents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Factures Policies (Admin only)
-- ============================================

-- Admin can do everything
CREATE POLICY "Admins can manage factures"
  ON factures FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- Facture Documents Policies (Admin only)
-- ============================================

CREATE POLICY "Admins can manage facture documents"
  ON facture_documents FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- 9. COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE factures IS 'Factures (clients and fournisseurs) - Admin only access';
COMMENT ON TABLE facture_documents IS 'PDF documents attached to factures';

COMMENT ON COLUMN factures.type IS 'Type de facture: client or fournisseur';
COMMENT ON COLUMN factures.contact_id IS 'Contact associé (client ou fournisseur)';
COMMENT ON COLUMN factures.numero_facture IS 'Numéro unique auto-généré (FAC/C-YYYY-NNNNN ou FAC/F-YYYY-NNNNN)';
COMMENT ON COLUMN factures.statut IS 'Statut: en_attente, payee, annulee';
COMMENT ON COLUMN factures.montant IS 'Montant en EUR';
COMMENT ON COLUMN factures.date_emission IS 'Date d''émission de la facture';
COMMENT ON COLUMN factures.date_echeance IS 'Date d''échéance de paiement';
COMMENT ON COLUMN factures.notes IS 'Notes additionnelles sur la facture';

COMMENT ON COLUMN facture_documents.facture_id IS 'ID de la facture associée';
COMMENT ON COLUMN facture_documents.nom_fichier IS 'Nom du fichier pour affichage';
COMMENT ON COLUMN facture_documents.nom_original IS 'Nom original du fichier uploadé';
COMMENT ON COLUMN facture_documents.storage_path IS 'Chemin dans Supabase Storage';
COMMENT ON COLUMN facture_documents.taille_fichier IS 'Taille en bytes (max 10MB)';
COMMENT ON COLUMN facture_documents.type_mime IS 'Type MIME (application/pdf uniquement)';
