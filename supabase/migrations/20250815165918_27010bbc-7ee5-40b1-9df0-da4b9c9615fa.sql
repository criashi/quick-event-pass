-- Fix scavenger hunt registration for anonymous users
-- Allow public registration while keeping email data protected

-- Update the INSERT policy to allow anonymous users to register
-- This is needed for QR code signup functionality
DROP POLICY IF EXISTS "Users can insert their own participation" ON public.scavenger_participants;

CREATE POLICY "Public can register for scavenger hunts" 
ON public.scavenger_participants 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- The SELECT policies remain restricted to authenticated users only
-- This means anonymous users can register but cannot read participant data
-- This protects email addresses while allowing public registration