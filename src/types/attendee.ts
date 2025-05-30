
export interface Attendee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  foodAllergies?: string;
  registrationTime: string;
  checkedIn: boolean;
  checkInTime?: string;
}

export interface EventStats {
  total: number;
  checkedIn: number;
  pending: number;
}
