-- Simple security fix: Remove public access to scavenger_participants
-- This is the core security issue that needs to be resolved immediately

-- Drop the existing view that was causing issues
DROP VIEW IF EXISTS public.scavenger_leaderboard;

-- The main security policies are already in place from the previous migration:
-- 1. "Admins can view all scavenger participants" - allows admin/user roles to see all data
-- 2. "Participants can view their own data" - allows users to see only their own records

-- For public leaderboard functionality, we'll handle this at the application level
-- rather than through database views to avoid security complexity

-- Verify that RLS is enabled on the table (should already be enabled)
ALTER TABLE public.scavenger_participants ENABLE ROW LEVEL SECURITY;