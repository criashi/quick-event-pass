-- Fix RLS policies to ensure anonymous users can access scavenger hunts and locations

-- Update scavenger_hunts policy to explicitly include anon role
DROP POLICY IF EXISTS "Public can view active scavenger hunts" ON scavenger_hunts;

CREATE POLICY "Public can view active scavenger hunts" 
ON scavenger_hunts 
FOR SELECT 
TO anon, authenticated
USING (is_active = true);

-- Ensure scavenger_locations are accessible to anonymous users for the trivia flow
CREATE POLICY IF NOT EXISTS "Public can view scavenger locations" 
ON scavenger_locations 
FOR SELECT 
TO anon, authenticated
USING (true);