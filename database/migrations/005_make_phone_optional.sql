-- ============================================
-- Migration 005: Make Phone Number Optional
-- Description: Allow contacts to be created without a phone number
-- Author: Claude Code
-- Date: 2025-11-03
-- ============================================

-- ============================================
-- 1. ALTER CONTACTS TABLE - Make phone nullable
-- ============================================

ALTER TABLE contacts ALTER COLUMN phone DROP NOT NULL;

-- ============================================
-- 2. COMMENTS (Documentation)
-- ============================================

COMMENT ON COLUMN contacts.phone IS 'Phone number (optional)';
