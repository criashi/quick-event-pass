
export interface Event {
  id: string;
  name: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  timezone: string;
  is_active: boolean;
  scavenger_hunt_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FieldMapping {
  id: string;
  event_id?: string;
  field_name: string;
  source_field_name: string;
  field_type: string;
  is_required: boolean;
  created_at?: string;
}

export interface EventStats {
  total: number;
  checkedIn: number;
  pending: number;
}
