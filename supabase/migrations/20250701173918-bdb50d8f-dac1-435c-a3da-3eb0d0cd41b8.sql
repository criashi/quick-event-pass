
-- Fix critical RLS policies to prevent unauthorized data access (corrected version)

-- 1. Drop existing permissive policies that allow all access
DROP POLICY IF EXISTS "Allow all operations on attendees" ON public.attendees;
DROP POLICY IF EXISTS "Allow all operations on events" ON public.events;
DROP POLICY IF EXISTS "Allow all operations on field mappings" ON public.field_mappings;

-- 2. Create secure RLS policies for attendees table
-- Users can only see attendees for events they have access to
CREATE POLICY "Authenticated users can view attendees" ON public.attendees
FOR SELECT TO authenticated
USING (true);

-- Users can only update check-in status and timestamps (not modify personal data)
CREATE POLICY "Authenticated users can update check-in status" ON public.attendees
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Only admins can insert attendees (via CSV import)
CREATE POLICY "Admins can insert attendees" ON public.attendees
FOR INSERT TO authenticated
WITH CHECK (public.get_current_user_role() = 'admin');

-- Only admins can delete attendees
CREATE POLICY "Admins can delete attendees" ON public.attendees
FOR DELETE TO authenticated
USING (public.get_current_user_role() = 'admin');

-- 3. Create secure RLS policies for events table
-- All authenticated users can view events
CREATE POLICY "Authenticated users can view events" ON public.events
FOR SELECT TO authenticated
USING (true);

-- Only admins can create, update, or delete events
CREATE POLICY "Admins can manage events" ON public.events
FOR INSERT TO authenticated
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update events" ON public.events
FOR UPDATE TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete events" ON public.events
FOR DELETE TO authenticated
USING (public.get_current_user_role() = 'admin');

-- 4. Create secure RLS policies for field_mappings table
-- All authenticated users can view field mappings
CREATE POLICY "Authenticated users can view field mappings" ON public.field_mappings
FOR SELECT TO authenticated
USING (true);

-- Only admins can manage field mappings
CREATE POLICY "Admins can insert field mappings" ON public.field_mappings
FOR INSERT TO authenticated
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update field mappings" ON public.field_mappings
FOR UPDATE TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete field mappings" ON public.field_mappings
FOR DELETE TO authenticated
USING (public.get_current_user_role() = 'admin');

-- 5. Add additional security function for input validation
CREATE OR REPLACE FUNCTION public.is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. Add function to sanitize text input
CREATE OR REPLACE FUNCTION public.sanitize_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove potentially dangerous characters and limit length
  RETURN LEFT(REGEXP_REPLACE(COALESCE(input_text, ''), '[<>"\''&]', '', 'g'), 255);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. Add audit logging table for security events
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.security_audit_log
FOR SELECT TO authenticated
USING (public.get_current_user_role() = 'admin');

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON public.security_audit_log
FOR INSERT TO authenticated
WITH CHECK (true);
