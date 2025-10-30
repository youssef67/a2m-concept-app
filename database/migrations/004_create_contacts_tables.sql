-- ============================================
-- Migration 004: Contacts System (Clients & Fournisseurs)
-- Description: Create contacts, addresses, and contact persons tables
-- Author: Claude Code
-- Date: 2025-10-30
-- ============================================

-- ============================================
-- 1. CONTACTS TABLE (Main table)
-- ============================================

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('client', 'fournisseur')),
  contact_type TEXT NOT NULL CHECK (contact_type IN ('particulier', 'professionnel')),

  -- Company info (for professionnel)
  company_name TEXT,

  -- Individual info (for particulier)
  first_name TEXT,
  last_name TEXT,

  -- Common fields
  phone TEXT NOT NULL,
  email TEXT,
  notes TEXT,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT company_name_required_for_professionnel
    CHECK (
      (contact_type = 'professionnel' AND company_name IS NOT NULL) OR
      (contact_type = 'particulier')
    ),
  CONSTRAINT names_required_for_particulier
    CHECK (
      (contact_type = 'particulier' AND first_name IS NOT NULL AND last_name IS NOT NULL) OR
      (contact_type = 'professionnel')
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_type ON contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON contacts(created_by);

-- ============================================
-- 2. CONTACT ADDRESSES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS contact_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID UNIQUE NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'France',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_contact_addresses_contact_id ON contact_addresses(contact_id);

-- ============================================
-- 3. CONTACT PERSONS TABLE (for professionnel)
-- ============================================

CREATE TABLE IF NOT EXISTS contact_persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  position TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_contact_persons_contact_id ON contact_persons(contact_id);

-- ============================================
-- 4. TRIGGER: Auto-update updated_at
-- ============================================

-- Reuse existing handle_updated_at() function
DROP TRIGGER IF EXISTS on_contact_updated ON contacts;
CREATE TRIGGER on_contact_updated
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_persons ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Contacts Policies (Admin only)
-- ============================================

-- Admin can do everything
CREATE POLICY "Admins can manage contacts"
  ON contacts FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- Contact Addresses Policies (Admin only)
-- ============================================

CREATE POLICY "Admins can manage contact addresses"
  ON contact_addresses FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- Contact Persons Policies (Admin only)
-- ============================================

CREATE POLICY "Admins can manage contact persons"
  ON contact_persons FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- 6. COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE contacts IS 'Contacts (clients and fournisseurs) - Admin only access';
COMMENT ON TABLE contact_addresses IS 'Contact addresses (one per contact)';
COMMENT ON TABLE contact_persons IS 'Contact persons for professionnel contacts';

COMMENT ON COLUMN contacts.type IS 'Contact type: client or fournisseur';
COMMENT ON COLUMN contacts.contact_type IS 'Entity type: particulier or professionnel';
COMMENT ON COLUMN contacts.company_name IS 'Company name (required for professionnel)';
COMMENT ON COLUMN contacts.first_name IS 'First name (required for particulier)';
COMMENT ON COLUMN contacts.last_name IS 'Last name (required for particulier)';
COMMENT ON COLUMN contacts.notes IS 'Additional notes/comments about the contact';
