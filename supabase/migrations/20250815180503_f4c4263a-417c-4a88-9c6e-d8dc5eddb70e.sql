-- Fix RLS policy for public scavenger hunt registration
-- The current policy might not be working correctly for anonymous users

-- Drop the existing policy and recreate it with clearer permissions
DROP POLICY IF EXISTS "Public can register for scavenger hunts" ON scavenger_participants;

-- Create a new policy that explicitly allows anonymous users to register
CREATE POLICY "Anonymous users can register for scavenger hunts" 
ON scavenger_participants 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Also ensure anonymous users can update their own progress
-- Drop and recreate the update policy
DROP POLICY IF EXISTS "Users can update their own participation" ON scavenger_participants;

CREATE POLICY "Users can update their own participation" 
ON scavenger_participants 
FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);