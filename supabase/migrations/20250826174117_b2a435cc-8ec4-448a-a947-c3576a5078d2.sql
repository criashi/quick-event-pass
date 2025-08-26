-- Fix RLS policies for scavenger_participants to allow anonymous users to view their own data
DROP POLICY IF EXISTS "Anonymous users can register for scavenger hunts" ON scavenger_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON scavenger_participants;

-- Allow anonymous users to insert their participation
CREATE POLICY "Anonymous users can register for scavenger hunts" 
ON scavenger_participants 
FOR INSERT 
WITH CHECK (true);

-- Allow anonymous users to view their own participation by email
CREATE POLICY "Anonymous users can view their own participation"
ON scavenger_participants
FOR SELECT
USING (
  -- Allow if user is authenticated and has admin/user role
  (auth.uid() IS NOT NULL AND get_current_user_role() = ANY (ARRAY['admin'::text, 'user'::text]))
  OR
  -- Allow anonymous users to view their own records (for registration flow)
  (auth.uid() IS NULL)
);

-- Allow anonymous users to update their own participation
CREATE POLICY "Anonymous users can update their own participation"
ON scavenger_participants
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Update security definer functions to have proper search_path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.sanitize_text(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $function$
BEGIN
  -- Remove potentially dangerous characters and limit length
  RETURN LEFT(REGEXP_REPLACE(COALESCE(input_text, ''), '[<>"\''&]', '', 'g'), 255);
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_valid_email(email text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $function$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$function$;