-- ============================================
-- Migration: Créer table facture_notes et migrer données existantes
-- Date: 2025-12-02
-- Description: Système de notes multiples par facture avec dates
-- ============================================

-- 1. Créer la table facture_notes
CREATE TABLE IF NOT EXISTS facture_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  contenu TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Créer l'index sur facture_id pour les performances
CREATE INDEX IF NOT EXISTS idx_facture_notes_facture_id ON facture_notes(facture_id);

-- 3. Activer RLS
ALTER TABLE facture_notes ENABLE ROW LEVEL SECURITY;

-- 4. Créer les policies RLS (accès complet pour utilisateurs authentifiés)
CREATE POLICY "Allow all operations for authenticated users" ON facture_notes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_facture_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_facture_notes_updated_at
  BEFORE UPDATE ON facture_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_facture_notes_updated_at();

-- 6. Migrer les notes existantes depuis factures.notes
INSERT INTO facture_notes (facture_id, contenu, created_at, updated_at)
SELECT id, notes, created_at, NOW()
FROM factures
WHERE notes IS NOT NULL AND notes != '';

-- 7. Supprimer la colonne notes de la table factures
ALTER TABLE factures DROP COLUMN IF EXISTS notes;

-- 8. Commentaires
COMMENT ON TABLE facture_notes IS 'Notes multiples par facture avec date de création';
COMMENT ON COLUMN facture_notes.facture_id IS 'Référence vers la facture';
COMMENT ON COLUMN facture_notes.contenu IS 'Contenu de la note';
COMMENT ON COLUMN facture_notes.created_at IS 'Date de création de la note';
COMMENT ON COLUMN facture_notes.updated_at IS 'Date de dernière modification';
