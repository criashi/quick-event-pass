-- Update RLS policies to allow users (not just admins) to manage scavenger hunts

-- Drop existing admin-only policies for scavenger_hunts
DROP POLICY IF EXISTS "Admins can manage scavenger hunts" ON public.scavenger_hunts;

-- Create new policies that allow both admins and users to manage scavenger hunts
CREATE POLICY "Authenticated users can manage scavenger hunts" 
ON public.scavenger_hunts 
FOR ALL 
TO authenticated
USING (get_current_user_role() IN ('admin', 'user'))
WITH CHECK (get_current_user_role() IN ('admin', 'user'));

-- Drop existing admin-only policies for scavenger_locations
DROP POLICY IF EXISTS "Admins can manage scavenger locations" ON public.scavenger_locations;

-- Create new policies that allow both admins and users to manage scavenger locations
CREATE POLICY "Authenticated users can manage scavenger locations" 
ON public.scavenger_locations 
FOR ALL 
TO authenticated
USING (get_current_user_role() IN ('admin', 'user'))
WITH CHECK (get_current_user_role() IN ('admin', 'user'));