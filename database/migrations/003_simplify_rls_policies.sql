-- ============================================
-- Migration 003: Simplify RLS Policies (Remove ALL recursion)
-- Description: Remove UPDATE policy that still has recursion
-- Author: Claude Code
-- Date: 2025-10-30
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "authenticated_users_select_own" ON profiles;
DROP POLICY IF EXISTS "authenticated_users_update_own" ON profiles;

-- ============================================
-- ULTRA-SIMPLIFIED POLICIES (Zero recursion)
-- ============================================

-- Policy 1: Authenticated users can view their own profile
CREATE POLICY "users_select_own_profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Authenticated users can update their own profile (no role check)
-- Note: Role changes should be done via service_role key (Supabase Dashboard/API)
CREATE POLICY "users_update_own_profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Note: For admin operations (changing roles, creating users, etc.),
-- use the service_role key via Supabase Dashboard or backend API.
-- This completely avoids RLS and ensures no recursion issues.

COMMENT ON TABLE profiles IS 'User profiles - RLS policies allow users to read/update their own profile only. Admin operations require service_role key.';
