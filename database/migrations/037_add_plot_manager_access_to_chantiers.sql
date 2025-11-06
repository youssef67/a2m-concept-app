-- ============================================
-- Migration 037: Add Plot Manager Access to Chantiers
-- Description: Ajouter une colonne pour contrôler la visibilité des chantiers dans Plot Manager
-- Author: Claude Code
-- Date: 2025-11-06
-- ============================================

-- ============================================
-- 1. ADD COLUMN
-- ============================================

-- Ajouter colonne plot_manager_access (FALSE par défaut)
ALTER TABLE chantiers
ADD COLUMN IF NOT EXISTS plot_manager_access BOOLEAN DEFAULT FALSE;

-- ============================================
-- 2. CREATE INDEX
-- ============================================

-- Index pour améliorer les performances de filtrage dans Plot Manager
CREATE INDEX IF NOT EXISTS idx_chantiers_plot_manager_access
ON chantiers(plot_manager_access);

-- ============================================
-- 3. COMMENTS (Documentation)
-- ============================================

COMMENT ON COLUMN chantiers.plot_manager_access IS 'Indique si le chantier est visible dans le module Plot Manager (défaut: false)';
