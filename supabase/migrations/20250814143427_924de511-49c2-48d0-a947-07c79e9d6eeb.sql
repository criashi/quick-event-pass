-- Create scavenger_hunts table
CREATE TABLE public.scavenger_hunts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  name TEXT NOT NULL,
  total_locations INTEGER NOT NULL DEFAULT 0,
  signup_qr_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scavenger_locations table
CREATE TABLE public.scavenger_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scavenger_hunt_id UUID NOT NULL REFERENCES public.scavenger_hunts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of option strings
  correct_answer TEXT NOT NULL,
  location_order INTEGER NOT NULL,
  qr_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scavenger_participants table
CREATE TABLE public.scavenger_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scavenger_hunt_id UUID NOT NULL REFERENCES public.scavenger_hunts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  progress JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of completed location IDs
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(scavenger_hunt_id, email)
);

-- Add scavenger hunt enabled flag to events table
ALTER TABLE public.events 
ADD COLUMN scavenger_hunt_enabled BOOLEAN DEFAULT false;

-- Enable Row Level Security
ALTER TABLE public.scavenger_hunts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scavenger_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scavenger_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scavenger_hunts
CREATE POLICY "Authenticated users can view scavenger hunts" 
ON public.scavenger_hunts 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage scavenger hunts" 
ON public.scavenger_hunts 
FOR ALL 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- RLS Policies for scavenger_locations
CREATE POLICY "Authenticated users can view scavenger locations" 
ON public.scavenger_locations 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage scavenger locations" 
ON public.scavenger_locations 
FOR ALL 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- RLS Policies for scavenger_participants
CREATE POLICY "Users can view scavenger participants" 
ON public.scavenger_participants 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own participation" 
ON public.scavenger_participants 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own participation" 
ON public.scavenger_participants 
FOR UPDATE 
USING (true);

CREATE POLICY "Admins can manage scavenger participants" 
ON public.scavenger_participants 
FOR ALL 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Create indexes for better performance
CREATE INDEX idx_scavenger_hunts_event_id ON public.scavenger_hunts(event_id);
CREATE INDEX idx_scavenger_locations_hunt_id ON public.scavenger_locations(scavenger_hunt_id);
CREATE INDEX idx_scavenger_participants_hunt_id ON public.scavenger_participants(scavenger_hunt_id);
CREATE INDEX idx_scavenger_participants_email ON public.scavenger_participants(email);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_scavenger_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_scavenger_hunts_updated_at
BEFORE UPDATE ON public.scavenger_hunts
FOR EACH ROW
EXECUTE FUNCTION public.update_scavenger_updated_at_column();

CREATE TRIGGER update_scavenger_participants_updated_at
BEFORE UPDATE ON public.scavenger_participants
FOR EACH ROW
EXECUTE FUNCTION public.update_scavenger_updated_at_column();