
-- First, let's check what users exist and their roles
SELECT id, email, role FROM public.profiles;

-- Update the user role to admin (replace with your actual email)
-- You'll need to replace 'your-email@example.com' with your actual email address
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Alternative: If you want to make the first user an admin automatically
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM public.profiles 
  ORDER BY created_at 
  LIMIT 1
);
