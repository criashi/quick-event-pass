-- Fix RLS policies to ensure anonymous users can access scavenger hunts and locations

-- Update scavenger_hunts policy to explicitly include anon role
DROP POLICY IF EXISTS "Public can view active scavenger hunts" ON scavenger_hunts;

CREATE POLICY "Public can view active scavenger hunts" 
ON scavenger_hunts 
FOR SELECT 
TO anon, authenticated
USING (is_active = true);

-- Drop existing policy if it exists and create new one for scavenger_locations
DROP POLICY IF EXISTS "Public can view scavenger locations" ON scavenger_locations;

CREATE POLICY "Public can view scavenger locations" 
ON scavenger_locations 
FOR SELECT 
TO anon, authenticated
USING (true);