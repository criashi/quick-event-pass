
export interface Attendee {
  id: string;
  form_id?: number;
  start_time?: string;
  completion_time?: string;
  email?: string;
  name?: string;
  full_name: string;
  continental_email: string;
  employee_number?: string;
  business_area?: string;
  vegetarian_vegan_option?: string;
  checked_in: boolean;
  check_in_time?: string;
  qr_code_data?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EventStats {
  total: number;
  checkedIn: number;
  pending: number;
}
