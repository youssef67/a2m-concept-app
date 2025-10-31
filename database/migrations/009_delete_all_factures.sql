-- ============================================
-- Migration 009: Delete all factures and paiements
-- Description: Clean all factures and related paiements from DEV database
-- Author: Claude Code
-- Date: 2025-10-31
-- ⚠️ WARNING: This is a destructive operation, use only in DEV
-- ============================================

-- Delete all paiements (will be cascade deleted from factures anyway)
DELETE FROM paiements;

-- Delete all factures
DELETE FROM factures;

-- Verify deletion
SELECT COUNT(*) as remaining_factures FROM factures;
SELECT COUNT(*) as remaining_paiements FROM paiements;
