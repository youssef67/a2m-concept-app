-- ============================================
-- Migration 029: Appartement Notes and Photos System
-- Description: Create tables for notes and photos attached to appartements
-- Notes and photos are independent but can be linked optionally
-- Author: Claude Code
-- Date: 2025-11-03
-- ============================================

-- ============================================
-- 1. APPARTEMENT_NOTES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS appartement_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  appartement_id UUID NOT NULL REFERENCES appartements(id) ON DELETE CASCADE,

  -- Content
  contenu TEXT NOT NULL CHECK (LENGTH(TRIM(contenu)) > 0),

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. APPARTEMENT_PHOTOS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS appartement_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  appartement_id UUID NOT NULL REFERENCES appartements(id) ON DELETE CASCADE,
  note_id UUID REFERENCES appartement_notes(id) ON DELETE SET NULL,

  -- File information
  nom_fichier TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  taille_fichier BIGINT NOT NULL,
  type_mime TEXT NOT NULL,

  -- Metadata
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_photo_size
    CHECK (taille_fichier > 0 AND taille_fichier <= 10485760),
  CONSTRAINT valid_photo_mime
    CHECK (type_mime IN ('image/jpeg', 'image/png', 'image/webp'))
);

-- ============================================
-- 3. INDEXES
-- ============================================

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_appartement_notes_appartement_id
  ON appartement_notes(appartement_id);
CREATE INDEX IF NOT EXISTS idx_appartement_notes_created_at
  ON appartement_notes(created_at DESC);

-- Photos indexes
CREATE INDEX IF NOT EXISTS idx_appartement_photos_appartement_id
  ON appartement_photos(appartement_id);
CREATE INDEX IF NOT EXISTS idx_appartement_photos_note_id
  ON appartement_photos(note_id);
CREATE INDEX IF NOT EXISTS idx_appartement_photos_created_at
  ON appartement_photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appartement_photos_storage_path
  ON appartement_photos(storage_path);

-- ============================================
-- 4. TRIGGERS: Auto-update updated_at
-- ============================================

-- Notes trigger
DROP TRIGGER IF EXISTS on_appartement_note_updated ON appartement_notes;
CREATE TRIGGER on_appartement_note_updated
  BEFORE UPDATE ON appartement_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Photos trigger
DROP TRIGGER IF EXISTS on_appartement_photo_updated ON appartement_photos;
CREATE TRIGGER on_appartement_photo_updated
  BEFORE UPDATE ON appartement_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE appartement_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE appartement_photos ENABLE ROW LEVEL SECURITY;

-- Notes policies (Admin only)
CREATE POLICY "Admins can manage appartement notes"
  ON appartement_notes FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Photos policies (Admin only)
CREATE POLICY "Admins can manage appartement photos"
  ON appartement_photos FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- 6. COMMENTS (Documentation)
-- ============================================

-- Notes table comments
COMMENT ON TABLE appartement_notes IS 'Notes textuelles attachées aux appartements avec historique';
COMMENT ON COLUMN appartement_notes.appartement_id IS 'ID de l''appartement associé';
COMMENT ON COLUMN appartement_notes.contenu IS 'Contenu de la note (modifiable)';
COMMENT ON COLUMN appartement_notes.created_by IS 'Utilisateur ayant créé la note';

-- Photos table comments
COMMENT ON TABLE appartement_photos IS 'Photos attachées aux appartements - peuvent être liées à des notes optionnellement';
COMMENT ON COLUMN appartement_photos.appartement_id IS 'ID de l''appartement associé';
COMMENT ON COLUMN appartement_photos.note_id IS 'ID de la note liée (NULL si photo indépendante)';
COMMENT ON COLUMN appartement_photos.nom_fichier IS 'Nom du fichier pour affichage';
COMMENT ON COLUMN appartement_photos.storage_path IS 'Chemin dans Supabase Storage (bucket: appartements-photos)';
COMMENT ON COLUMN appartement_photos.taille_fichier IS 'Taille en bytes (max 10MB)';
COMMENT ON COLUMN appartement_photos.type_mime IS 'Type MIME (image/jpeg, image/png, image/webp)';
COMMENT ON COLUMN appartement_photos.uploaded_by IS 'Utilisateur ayant uploadé la photo';
