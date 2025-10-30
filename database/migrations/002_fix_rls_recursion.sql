-- ============================================
-- Migration 002: Fix RLS Infinite Recursion
-- Description: Simplify RLS policies to avoid recursion
-- Author: Claude Code
-- Date: 2025-10-30
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

-- ============================================
-- SIMPLIFIED POLICIES (No recursion)
-- ============================================

-- Policy 1: All authenticated users can view their own profile
CREATE POLICY "authenticated_users_select_own"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile (but not change role)
CREATE POLICY "authenticated_users_update_own"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Note: For admin operations (insert/delete/update other profiles),
-- use the service_role key via Supabase Dashboard or backend API
-- This avoids RLS recursion issues while keeping the database secure

COMMENT ON TABLE profiles IS 'User profiles - authenticated users can only access their own profile';
