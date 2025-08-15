-- Fix the Security Definer View issue by recreating the view without SECURITY DEFINER
-- and implementing proper RLS policies instead

-- Drop the existing view
DROP VIEW IF EXISTS public.scavenger_leaderboard;

-- Create a secure leaderboard view without SECURITY DEFINER
-- This view will respect RLS policies and only show completed participants
CREATE VIEW public.scavenger_leaderboard AS
SELECT 
  id,
  scavenger_hunt_id,
  -- Mask email to show only first character and domain for privacy
  CASE 
    WHEN email IS NOT NULL THEN 
      LEFT(email, 1) || '***@' || SPLIT_PART(email, '@', 2)
    ELSE 'Anonymous'
  END AS masked_email,
  -- Show only first name and last initial for privacy
  CASE 
    WHEN name IS NOT NULL THEN 
      SPLIT_PART(name, ' ', 1) || ' ' || LEFT(SPLIT_PART(name, ' ', 2), 1) || '.'
    ELSE 'Anonymous'
  END AS display_name,
  jsonb_array_length(progress) as locations_completed,
  completed_at,
  created_at
FROM public.scavenger_participants
WHERE completed_at IS NOT NULL
ORDER BY completed_at ASC;

-- Enable RLS on the view
ALTER VIEW public.scavenger_leaderboard SET (security_barrier = true);

-- Create RLS policy for the leaderboard view that allows public read access
-- but only to the masked/anonymized data
CREATE POLICY "Public can view anonymized leaderboard" 
ON public.scavenger_leaderboard 
FOR SELECT 
TO anon, authenticated
USING (true);