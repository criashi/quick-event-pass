-- Add congratulations message field to scavenger hunts table
ALTER TABLE public.scavenger_hunts 
ADD COLUMN congratulations_message text DEFAULT 'You''ve successfully completed the scavenger hunt! Your name will be entered into a drawing for an AUMOVIO cooler bag and you will be contacted by MarComm if you''re one of the ten lucky winners!';