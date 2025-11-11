-- ============================================
-- Migration 041: Système de gestion des livraisons pour appartements
-- Description: Gestion des statuts de livraison avec historique et photos
-- Author: Claude Code
-- Date: 2025-01-11
-- ============================================

-- ============================================
-- 1. TABLE PRINCIPALE: APPARTEMENT_LIVRAISONS
-- ============================================

CREATE TABLE IF NOT EXISTS appartement_livraisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations (un appartement = une livraison)
  appartement_id UUID NOT NULL UNIQUE REFERENCES appartements(id) ON DELETE CASCADE,

  -- Statut de la livraison (5 états possibles)
  statut TEXT NOT NULL DEFAULT 'non_commande' CHECK (
    statut IN (
      'non_commande',
      'commande_effectuee',
      'en_cours_livraison',
      'commande_sur_site',
      'commande_incomplete'
    )
  ),

  -- Informations commande (pour statut "commande_effectuee")
  date_commande DATE NULL,
  fournisseur TEXT NULL,
  numero_commande TEXT NULL,

  -- Date livraison prévue (pour statut "en_cours_livraison")
  date_livraison_prevue DATE NULL,

  -- Date réception (pour statuts "commande_sur_site" et "commande_incomplete")
  date_reception DATE NULL,

  -- Note pour commande incomplète
  note_incomplete TEXT NULL,

  -- Métadonnées
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_appartement_livraisons_appartement_id
  ON appartement_livraisons(appartement_id);
CREATE INDEX IF NOT EXISTS idx_appartement_livraisons_statut
  ON appartement_livraisons(statut);
CREATE INDEX IF NOT EXISTS idx_appartement_livraisons_date_livraison
  ON appartement_livraisons(date_livraison_prevue)
  WHERE date_livraison_prevue IS NOT NULL;

-- Commentaires
COMMENT ON TABLE appartement_livraisons IS
  'Gestion des statuts de livraison pour chaque appartement';
COMMENT ON COLUMN appartement_livraisons.statut IS
  'Statut: non_commande, commande_effectuee, en_cours_livraison, commande_sur_site, commande_incomplete';
COMMENT ON COLUMN appartement_livraisons.date_livraison_prevue IS
  'Date prévue de livraison (utilisée pour calculer les jours de retard)';

-- ============================================
-- 2. TABLE PHOTOS: APPARTEMENT_LIVRAISON_PHOTOS
-- ============================================

CREATE TABLE IF NOT EXISTS appartement_livraison_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  livraison_id UUID NOT NULL REFERENCES appartement_livraisons(id) ON DELETE CASCADE,
  appartement_id UUID NOT NULL REFERENCES appartements(id) ON DELETE CASCADE,

  -- Informations fichier
  nom_fichier TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  taille_fichier BIGINT NOT NULL,
  type_mime TEXT NOT NULL,

  -- Métadonnées
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT valid_photo_size
    CHECK (taille_fichier > 0 AND taille_fichier <= 10485760), -- 10MB max
  CONSTRAINT valid_photo_mime
    CHECK (type_mime IN ('image/jpeg', 'image/png', 'image/webp'))
);

-- Index
CREATE INDEX IF NOT EXISTS idx_appartement_livraison_photos_livraison_id
  ON appartement_livraison_photos(livraison_id);
CREATE INDEX IF NOT EXISTS idx_appartement_livraison_photos_appartement_id
  ON appartement_livraison_photos(appartement_id);
CREATE INDEX IF NOT EXISTS idx_appartement_livraison_photos_storage_path
  ON appartement_livraison_photos(storage_path);

-- Commentaires
COMMENT ON TABLE appartement_livraison_photos IS
  'Photos des commandes incomplètes (plusieurs photos possibles)';
COMMENT ON COLUMN appartement_livraison_photos.storage_path IS
  'Chemin dans Supabase Storage (bucket: appartements-livraisons)';

-- ============================================
-- 3. TABLE HISTORIQUE: APPARTEMENT_LIVRAISON_HISTORIQUE
-- ============================================

CREATE TABLE IF NOT EXISTS appartement_livraison_historique (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  appartement_id UUID NOT NULL REFERENCES appartements(id) ON DELETE CASCADE,
  livraison_id UUID NOT NULL REFERENCES appartement_livraisons(id) ON DELETE CASCADE,

  -- Changement de statut
  ancien_statut TEXT NOT NULL,
  nouveau_statut TEXT NOT NULL,

  -- Données associées au changement (snapshot)
  date_commande DATE NULL,
  fournisseur TEXT NULL,
  numero_commande TEXT NULL,
  date_livraison_prevue DATE NULL,
  date_reception DATE NULL,
  note_incomplete TEXT NULL,

  -- Métadonnées
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_appartement_livraison_historique_appartement_id
  ON appartement_livraison_historique(appartement_id);
CREATE INDEX IF NOT EXISTS idx_appartement_livraison_historique_livraison_id
  ON appartement_livraison_historique(livraison_id);
CREATE INDEX IF NOT EXISTS idx_appartement_livraison_historique_created_at
  ON appartement_livraison_historique(created_at DESC);

-- Commentaires
COMMENT ON TABLE appartement_livraison_historique IS
  'Historique automatique des changements de statut de livraison';

-- ============================================
-- 4. VUE: LIVRAISONS AVEC CALCUL JOURS RETARD
-- ============================================

CREATE OR REPLACE VIEW appartement_livraisons_with_retard AS
SELECT
  l.*,
  CASE
    WHEN l.statut = 'en_cours_livraison'
         AND l.date_livraison_prevue IS NOT NULL
         AND l.date_livraison_prevue < CURRENT_DATE
    THEN CURRENT_DATE - l.date_livraison_prevue
    ELSE 0
  END AS jours_retard
FROM appartement_livraisons l;

COMMENT ON VIEW appartement_livraisons_with_retard IS
  'Vue avec calcul automatique des jours de retard pour livraisons en cours';

-- ============================================
-- 5. TRIGGER: INITIALISATION AUTOMATIQUE
-- ============================================

-- Fonction: Créer automatiquement une livraison "non_commande"
-- lors de la création d'un appartement
CREATE OR REPLACE FUNCTION create_initial_livraison()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO appartement_livraisons (
    appartement_id,
    statut,
    created_by
  ) VALUES (
    NEW.id,
    'non_commande',
    NEW.created_by
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur INSERT appartements
DROP TRIGGER IF EXISTS on_appartement_created_init_livraison ON appartements;
CREATE TRIGGER on_appartement_created_init_livraison
  AFTER INSERT ON appartements
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_livraison();

COMMENT ON FUNCTION create_initial_livraison() IS
  'Initialise automatiquement le statut de livraison à "non_commande" pour chaque nouvel appartement';

-- ============================================
-- 6. TRIGGER: HISTORIQUE AUTOMATIQUE
-- ============================================

-- Fonction: Logger automatiquement les changements de statut
CREATE OR REPLACE FUNCTION log_livraison_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Insérer dans l'historique uniquement si le statut a changé
  IF OLD.statut IS DISTINCT FROM NEW.statut THEN
    INSERT INTO appartement_livraison_historique (
      appartement_id,
      livraison_id,
      ancien_statut,
      nouveau_statut,
      date_commande,
      fournisseur,
      numero_commande,
      date_livraison_prevue,
      date_reception,
      note_incomplete,
      changed_by
    ) VALUES (
      NEW.appartement_id,
      NEW.id,
      OLD.statut,
      NEW.statut,
      NEW.date_commande,
      NEW.fournisseur,
      NEW.numero_commande,
      NEW.date_livraison_prevue,
      NEW.date_reception,
      NEW.note_incomplete,
      NEW.created_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur UPDATE appartement_livraisons
DROP TRIGGER IF EXISTS on_livraison_status_change_log ON appartement_livraisons;
CREATE TRIGGER on_livraison_status_change_log
  AFTER UPDATE ON appartement_livraisons
  FOR EACH ROW
  EXECUTE FUNCTION log_livraison_status_change();

COMMENT ON FUNCTION log_livraison_status_change() IS
  'Enregistre automatiquement dans l''historique chaque changement de statut de livraison';

-- ============================================
-- 7. TRIGGER: AUTO-UPDATE UPDATED_AT
-- ============================================

DROP TRIGGER IF EXISTS update_appartement_livraisons_updated_at ON appartement_livraisons;
CREATE TRIGGER update_appartement_livraisons_updated_at
  BEFORE UPDATE ON appartement_livraisons
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Livraisons
ALTER TABLE appartement_livraisons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage appartement livraisons" ON appartement_livraisons;
CREATE POLICY "Admins can manage appartement livraisons"
  ON appartement_livraisons FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Photos
ALTER TABLE appartement_livraison_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage livraison photos" ON appartement_livraison_photos;
CREATE POLICY "Admins can manage livraison photos"
  ON appartement_livraison_photos FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Historique
ALTER TABLE appartement_livraison_historique ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view livraison history" ON appartement_livraison_historique;
CREATE POLICY "Admins can view livraison history"
  ON appartement_livraison_historique FOR SELECT
  USING (public.is_admin());

-- ============================================
-- 9. INITIALISER LES LIVRAISONS EXISTANTES
-- ============================================

-- Pour les appartements existants qui n'ont pas encore de livraison,
-- créer automatiquement une livraison avec statut "non_commande"
INSERT INTO appartement_livraisons (appartement_id, statut, created_by)
SELECT
  a.id,
  'non_commande',
  a.created_by
FROM appartements a
WHERE NOT EXISTS (
  SELECT 1 FROM appartement_livraisons l
  WHERE l.appartement_id = a.id
);

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
