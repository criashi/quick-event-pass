-- Clean up multiple scavenger hunts for the same event
-- Set all but the most recent scavenger hunt for each event to inactive

UPDATE scavenger_hunts 
SET is_active = false 
WHERE id NOT IN (
  SELECT DISTINCT ON (event_id) id 
  FROM scavenger_hunts 
  ORDER BY event_id, created_at DESC
);

-- Ensure we have proper constraints to prevent multiple active hunts per event in the future
-- First, let's add a unique constraint for active scavenger hunts per event
CREATE UNIQUE INDEX CONCURRENTLY idx_unique_active_scavenger_hunt_per_event 
ON scavenger_hunts (event_id) 
WHERE is_active = true;