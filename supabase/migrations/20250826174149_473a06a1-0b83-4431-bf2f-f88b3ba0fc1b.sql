-- Fix remaining functions that don't have search_path set
CREATE OR REPLACE FUNCTION public.update_scavenger_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_single_active_scavenger_hunt()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  -- If the new/updated hunt is active, deactivate all other hunts for the same event
  IF NEW.is_active = true THEN
    UPDATE scavenger_hunts 
    SET is_active = false 
    WHERE event_id = NEW.event_id 
    AND id != NEW.id 
    AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$function$;