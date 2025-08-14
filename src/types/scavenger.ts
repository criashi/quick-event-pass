export interface ScavengerHunt {
  id: string;
  event_id: string;
  name: string;
  total_locations: number;
  signup_qr_token: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScavengerLocation {
  id: string;
  scavenger_hunt_id: string;
  name: string;
  question: string;
  options: string[];
  correct_answer: string;
  location_order: number;
  qr_token: string;
  created_at: string;
}

export interface ScavengerParticipant {
  id: string;
  scavenger_hunt_id: string;
  name: string;
  email: string;
  progress: string[]; // Array of completed location IDs
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// Database response types (with Json types)
export interface ScavengerLocationDB {
  id: string;
  scavenger_hunt_id: string;
  name: string;
  question: string;
  options: any; // Json type from Supabase
  correct_answer: string;
  location_order: number;
  qr_token: string;
  created_at: string;
}

export interface ScavengerParticipantDB {
  id: string;
  scavenger_hunt_id: string;
  name: string;
  email: string;
  progress: any; // Json type from Supabase
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ScavengerHuntFormData {
  name: string;
  locations: {
    name: string;
    question: string;
    options: string[];
    correct_answer: string;
  }[];
}

export interface QRCodeData {
  type: 'signup' | 'location';
  token: string;
  huntId?: string;
  locationId?: string;
}