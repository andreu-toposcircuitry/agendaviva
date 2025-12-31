-- Migration: Admin Users Table
-- Description: Creates table to track admin/moderator users who can manage activities
-- This table is used for role-based access control in the admin UI

BEGIN;

-- Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'moderator')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT
);

COMMENT ON TABLE public.admin_users IS 'Admin and moderator users with access to manage activities';
COMMENT ON COLUMN public.admin_users.role IS 'admin: full access, moderator: can review and edit';
COMMENT ON COLUMN public.admin_users.is_active IS 'Whether the admin user is currently active';

-- Create index on email for quick lookups
CREATE INDEX admin_users_email_idx ON public.admin_users(email);
CREATE INDEX admin_users_role_idx ON public.admin_users(role);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage admin_users
CREATE POLICY "Service role full access on admin_users"
ON public.admin_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Authenticated users can read admin_users to check their own role
CREATE POLICY "Authenticated users can read admin_users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (true);

-- Policy: Only admins can insert/update/delete admin_users
CREATE POLICY "Admins can manage admin_users"
ON public.admin_users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() 
    AND au.role = 'admin' 
    AND au.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() 
    AND au.role = 'admin' 
    AND au.is_active = true
  )
);

COMMIT;
