-- Fix multiple scavenger hunts issue by deactivating others when creating new one
-- First, create a function to ensure only one active scavenger hunt per event

-- Create unique constraint to prevent multiple active scavenger hunts per event
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_scavenger_hunt_per_event 
ON scavenger_hunts (event_id) 
WHERE is_active = true;

-- Create function to deactivate other scavenger hunts when creating a new one
CREATE OR REPLACE FUNCTION ensure_single_active_scavenger_hunt()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically manage active scavenger hunts
DROP TRIGGER IF EXISTS trigger_ensure_single_active_scavenger_hunt ON scavenger_hunts;
CREATE TRIGGER trigger_ensure_single_active_scavenger_hunt
  BEFORE INSERT OR UPDATE ON scavenger_hunts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_scavenger_hunt();

-- Fix existing data: ensure only the latest scavenger hunt is active per event
WITH latest_hunts AS (
  SELECT DISTINCT ON (event_id) id, event_id
  FROM scavenger_hunts
  WHERE is_active = true
  ORDER BY event_id, created_at DESC
)
UPDATE scavenger_hunts 
SET is_active = false 
WHERE is_active = true 
AND id NOT IN (SELECT id FROM latest_hunts);