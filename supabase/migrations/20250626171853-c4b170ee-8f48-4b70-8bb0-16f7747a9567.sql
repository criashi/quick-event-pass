
-- First, let's create a security definer function to safely get the user's role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Now let's drop the problematic policy and recreate it correctly
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a new policy that uses the security definer function
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.get_current_user_role() = 'admin');
