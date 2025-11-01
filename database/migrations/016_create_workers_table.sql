-- Migration: Create workers table
-- Description: Table pour gérer les travailleurs (nom, prénom, téléphone)
-- Author: Claude Code
-- Date: 2025-11-01

-- ============================================================================
-- TABLE: workers
-- ============================================================================

CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Champs principaux
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,

  -- Métadonnées
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT valid_phone_format CHECK (phone ~ '^[0-9]{10}$')
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_workers_created_by ON workers(created_by);
CREATE INDEX IF NOT EXISTS idx_workers_created_at ON workers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workers_last_name ON workers(last_name);

-- ============================================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS on_workers_updated ON workers;
CREATE TRIGGER on_workers_updated
  BEFORE UPDATE ON workers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

-- Politique: Seuls les admins peuvent gérer les workers
CREATE POLICY "Admins can manage workers"
  ON workers FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE workers IS 'Table des travailleurs avec accès admin uniquement';
COMMENT ON COLUMN workers.first_name IS 'Prénom du travailleur';
COMMENT ON COLUMN workers.last_name IS 'Nom du travailleur';
COMMENT ON COLUMN workers.phone IS 'Numéro de téléphone (10 chiffres)';
