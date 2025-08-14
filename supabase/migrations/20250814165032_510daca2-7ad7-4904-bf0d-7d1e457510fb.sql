-- Update RLS policy to allow public access to scavenger hunts
DROP POLICY IF EXISTS "Authenticated users can view scavenger hunts" ON public.scavenger_hunts;

CREATE POLICY "Public can view active scavenger hunts" 
ON public.scavenger_hunts 
FOR SELECT 
USING (is_active = true);

-- Update RLS policy to allow public access to scavenger locations  
DROP POLICY IF EXISTS "Authenticated users can view scavenger locations" ON public.scavenger_locations;

CREATE POLICY "Public can view scavenger locations" 
ON public.scavenger_locations 
FOR SELECT 
USING (true);

-- Update RLS policy to allow public access to view participants (for leaderboard)
DROP POLICY IF EXISTS "Users can view scavenger participants" ON public.scavenger_participants;

CREATE POLICY "Public can view scavenger participants" 
ON public.scavenger_participants 
FOR SELECT 
USING (true);