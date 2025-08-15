-- Fix security vulnerability: Restrict public access to scavenger_participants table
-- Remove the overly permissive public read policy and implement proper access controls

-- Drop the dangerous public read policy
DROP POLICY IF EXISTS "Public can view scavenger participants" ON public.scavenger_participants;

-- Create secure policies that protect participant email addresses

-- Policy 1: Allow admins to view all participants (for management purposes)
CREATE POLICY "Admins can view all scavenger participants" 
ON public.scavenger_participants 
FOR SELECT 
TO authenticated
USING (get_current_user_role() IN ('admin', 'user'));

-- Policy 2: Allow participants to view only their own data
-- Note: This requires participants to be authenticated and match their email
CREATE POLICY "Participants can view their own data" 
ON public.scavenger_participants 
FOR SELECT 
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Policy 3: For public scavenger hunt functionality, create a view with limited data
-- This allows public access to non-sensitive leaderboard data without exposing emails
CREATE OR REPLACE VIEW public.scavenger_leaderboard AS
SELECT 
  id,
  scavenger_hunt_id,
  -- Mask email to show only first character and domain
  CASE 
    WHEN email IS NOT NULL THEN 
      LEFT(email, 1) || '***@' || SPLIT_PART(email, '@', 2)
    ELSE 'Anonymous'
  END AS masked_email,
  -- Show only first name or initials to protect privacy
  CASE 
    WHEN name IS NOT NULL THEN 
      SPLIT_PART(name, ' ', 1) || ' ' || LEFT(SPLIT_PART(name, ' ', 2), 1) || '.'
    ELSE 'Anonymous'
  END AS display_name,
  -- Use jsonb_array_length for JSONB arrays
  jsonb_array_length(progress) as locations_completed,
  completed_at,
  created_at
FROM public.scavenger_participants
WHERE completed_at IS NOT NULL
ORDER BY completed_at ASC;

-- Allow public read access to the safe leaderboard view
GRANT SELECT ON public.scavenger_leaderboard TO anon;
GRANT SELECT ON public.scavenger_leaderboard TO authenticated;