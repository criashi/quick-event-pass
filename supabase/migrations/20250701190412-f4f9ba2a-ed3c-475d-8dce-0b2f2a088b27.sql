
-- Fix database warnings with proper data cleanup

-- 1. First, let's fix the NULL continental_email issue by providing a default format
UPDATE public.attendees 
SET continental_email = COALESCE(NULLIF(TRIM(continental_email), ''), 'unknown@continental.com')
WHERE continental_email IS NULL OR TRIM(continental_email) = '';

-- Clean up any remaining invalid emails by replacing with a default
UPDATE public.attendees 
SET continental_email = 'invalid@continental.com'
WHERE continental_email IS NOT NULL 
AND NOT (continental_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 2. Add missing foreign key constraints for better data integrity
ALTER TABLE public.attendees 
ADD CONSTRAINT fk_attendees_event_id 
FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.field_mappings 
ADD CONSTRAINT fk_field_mappings_event_id 
FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- 3. Add missing indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendees_event_id ON public.attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_attendees_checked_in ON public.attendees(checked_in);
CREATE INDEX IF NOT EXISTS idx_attendees_continental_email ON public.attendees(continental_email);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON public.security_audit_log(created_at);

-- 4. Add proper constraints for data validation (after cleanup)
ALTER TABLE public.attendees 
ADD CONSTRAINT chk_attendees_email_format 
CHECK (continental_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE public.events 
ADD CONSTRAINT chk_events_dates 
CHECK (start_time IS NULL OR end_time IS NULL OR start_time <= end_time);

-- 5. Update trigger function to handle metadata properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  );
  RETURN NEW;
END;
$$;
