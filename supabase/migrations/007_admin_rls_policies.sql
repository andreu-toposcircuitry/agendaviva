-- Migration: Admin RLS Policies for Activitats
-- Description: Adds RLS policies to allow authenticated admins/moderators to manage activities
-- This enables the admin UI to work with proper authentication

BEGIN;

-- Policy: Admins and moderators can read all activitats
CREATE POLICY "Admins and moderators can read all activitats"
ON public.activitats
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() 
    AND au.is_active = true
  )
);

-- Policy: Admins and moderators can update activitats
CREATE POLICY "Admins and moderators can update activitats"
ON public.activitats
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() 
    AND au.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() 
    AND au.is_active = true
  )
);

-- Policy: Admins can delete activitats
CREATE POLICY "Admins can delete activitats"
ON public.activitats
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() 
    AND au.role = 'admin'
    AND au.is_active = true
  )
);

-- Policy: Admins and moderators can insert activitats
CREATE POLICY "Admins and moderators can insert activitats"
ON public.activitats
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() 
    AND au.is_active = true
  )
);

-- Policy: Admins and moderators can manage cua_revisio
CREATE POLICY "Admins and moderators can read cua_revisio"
ON public.cua_revisio
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() 
    AND au.is_active = true
  )
);

CREATE POLICY "Admins and moderators can insert cua_revisio"
ON public.cua_revisio
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() 
    AND au.is_active = true
  )
);

CREATE POLICY "Admins and moderators can update cua_revisio"
ON public.cua_revisio
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() 
    AND au.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() 
    AND au.is_active = true
  )
);

CREATE POLICY "Admins and moderators can delete cua_revisio"
ON public.cua_revisio
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() 
    AND au.is_active = true
  )
);

-- Enable RLS on cua_revisio if not already enabled
ALTER TABLE public.cua_revisio ENABLE ROW LEVEL SECURITY;

COMMIT;
