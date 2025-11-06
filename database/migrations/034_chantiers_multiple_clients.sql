-- ============================================
-- Migration 034: Chantiers Multiple Clients
-- Description: Migrer de one-to-one à many-to-many pour les clients
-- Author: Claude Code
-- Date: 2025-11-06
-- ============================================

-- ============================================
-- 1. CREATE JUNCTION TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS chantier_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Empêcher les doublons (même client sur même chantier)
  UNIQUE(chantier_id, contact_id)
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_chantier_clients_chantier_id ON chantier_clients(chantier_id);
CREATE INDEX IF NOT EXISTS idx_chantier_clients_contact_id ON chantier_clients(contact_id);

-- ============================================
-- 3. MIGRATE EXISTING DATA
-- ============================================

-- Copier tous les client_id existants vers la nouvelle table
INSERT INTO chantier_clients (chantier_id, contact_id, created_at)
SELECT
  id as chantier_id,
  client_id as contact_id,
  created_at
FROM chantiers
WHERE client_id IS NOT NULL
ON CONFLICT (chantier_id, contact_id) DO NOTHING;

-- ============================================
-- 4. REMOVE OLD FOREIGN KEY AND COLUMN
-- ============================================

-- Supprimer la contrainte FK
ALTER TABLE chantiers DROP CONSTRAINT IF EXISTS chantiers_client_id_fkey;

-- Supprimer l'index
DROP INDEX IF EXISTS idx_chantiers_client_id;

-- Supprimer la colonne client_id
ALTER TABLE chantiers DROP COLUMN IF EXISTS client_id;

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE chantier_clients ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage chantier_clients"
  ON chantier_clients FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- 6. COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE chantier_clients IS 'Junction table for many-to-many relationship between chantiers and clients';
COMMENT ON COLUMN chantier_clients.chantier_id IS 'Référence au chantier';
COMMENT ON COLUMN chantier_clients.contact_id IS 'Référence au contact (client)';
