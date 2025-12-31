-- Migration: Admin Activity Audit Table
-- Description: Creates audit log table to track all admin actions on activities
-- Used for accountability, compliance, and debugging

BEGIN;

-- Create admin_activity_audit table
CREATE TABLE IF NOT EXISTS public.admin_activity_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL, -- 'create', 'update', 'publish', 'unpublish', 'delete', 'queue_add', 'queue_remove', 'bulk_publish', etc.
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT, -- Store email for reference even if user deleted
  activity_id UUID REFERENCES activitats(id) ON DELETE SET NULL,
  activity_name TEXT, -- Store name for reference
  payload JSONB, -- Changed fields, bulk operation details, etc.
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.admin_activity_audit IS 'Audit log of all admin actions on activities';
COMMENT ON COLUMN public.admin_activity_audit.action IS 'Type of action performed';
COMMENT ON COLUMN public.admin_activity_audit.payload IS 'JSON containing changed fields or operation details';

-- Create indexes for efficient querying
CREATE INDEX admin_activity_audit_created_idx ON public.admin_activity_audit(created_at DESC);
CREATE INDEX admin_activity_audit_user_idx ON public.admin_activity_audit(user_id);
CREATE INDEX admin_activity_audit_activity_idx ON public.admin_activity_audit(activity_id);
CREATE INDEX admin_activity_audit_action_idx ON public.admin_activity_audit(action);

-- Enable RLS on admin_activity_audit
ALTER TABLE public.admin_activity_audit ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do anything
CREATE POLICY "Service role full access on admin_activity_audit"
ON public.admin_activity_audit
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Authenticated admins/moderators can read audit logs
CREATE POLICY "Admins and moderators can read audit logs"
ON public.admin_activity_audit
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() 
    AND au.is_active = true
  )
);

-- Policy: Authenticated admins/moderators can insert audit logs
CREATE POLICY "Admins and moderators can insert audit logs"
ON public.admin_activity_audit
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() 
    AND au.is_active = true
  )
);

COMMIT;
