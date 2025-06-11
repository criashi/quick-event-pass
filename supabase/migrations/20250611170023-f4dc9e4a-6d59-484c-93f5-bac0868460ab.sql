
-- Create events table to store event configuration
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create field mappings table to handle different form structures
CREATE TABLE public.field_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL, -- The standard field name we use (e.g., 'full_name', 'email')
  source_field_name TEXT NOT NULL, -- The actual field name from the imported form
  field_type TEXT DEFAULT 'text', -- text, email, boolean, date, etc.
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add event_id to attendees table to link them to specific events
ALTER TABLE public.attendees ADD COLUMN event_id UUID REFERENCES public.events(id);

-- Create indexes for better performance
CREATE INDEX idx_attendees_event_id ON public.attendees(event_id);
CREATE INDEX idx_field_mappings_event_id ON public.field_mappings(event_id);

-- Enable RLS on new tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_mappings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for events (assuming admin access for now)
CREATE POLICY "Allow all operations on events" 
  ON public.events 
  FOR ALL 
  USING (true);

-- Create RLS policies for field mappings
CREATE POLICY "Allow all operations on field mappings" 
  ON public.field_mappings 
  FOR ALL 
  USING (true);

-- Insert a default event for existing data
INSERT INTO public.events (name, description, event_date, location, is_active)
VALUES (
  'Continental Employee Event',
  'Default event for existing attendee data',
  CURRENT_DATE,
  'Continental Headquarters',
  true
);

-- Link existing attendees to the default event
UPDATE public.attendees 
SET event_id = (SELECT id FROM public.events WHERE name = 'Continental Employee Event' LIMIT 1)
WHERE event_id IS NULL;
