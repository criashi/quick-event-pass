
import { useState } from "react";
import { Attendee, EventStats } from "@/types/attendee";

// Mock data simulating Microsoft Forms responses
const mockAttendees: Attendee[] = [
  {
    id: "1",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@company.com",
    department: "Engineering",
    foodAllergies: "None",
    registrationTime: "2024-01-15T10:30:00Z",
    checkedIn: false
  },
  {
    id: "2",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@company.com",
    department: "Marketing",
    foodAllergies: "Nuts, Dairy",
    registrationTime: "2024-01-15T11:45:00Z",
    checkedIn: true,
    checkInTime: "2024-01-16T09:15:00Z"
  },
  {
    id: "3",
    firstName: "Michael",
    lastName: "Johnson",
    email: "michael.johnson@company.com",
    department: "Sales",
    registrationTime: "2024-01-15T14:20:00Z",
    checkedIn: false
  },
  {
    id: "4",
    firstName: "Sarah",
    lastName: "Williams",
    email: "sarah.williams@company.com",
    department: "HR",
    foodAllergies: "Gluten",
    registrationTime: "2024-01-15T16:00:00Z",
    checkedIn: true,
    checkInTime: "2024-01-16T08:45:00Z"
  },
  {
    id: "5",
    firstName: "David",
    lastName: "Brown",
    email: "david.brown@company.com",
    department: "Engineering",
    registrationTime: "2024-01-16T08:30:00Z",
    checkedIn: false
  },
  {
    id: "6",
    firstName: "Emily",
    lastName: "Davis",
    email: "emily.davis@company.com",
    department: "Marketing",
    foodAllergies: "Shellfish",
    registrationTime: "2024-01-16T09:00:00Z",
    checkedIn: false
  },
  {
    id: "7",
    firstName: "Chris",
    lastName: "Wilson",
    email: "chris.wilson@company.com",
    department: "Finance",
    registrationTime: "2024-01-16T09:30:00Z",
    checkedIn: true,
    checkInTime: "2024-01-16T09:35:00Z"
  },
  {
    id: "8",
    firstName: "Lisa",
    lastName: "Anderson",
    email: "lisa.anderson@company.com",
    department: "Operations",
    registrationTime: "2024-01-16T10:00:00Z",
    checkedIn: false
  }
];

export const useEventData = () => {
  const [attendees, setAttendees] = useState<Attendee[]>(mockAttendees);

  const checkInAttendee = (attendeeId: string): boolean => {
    const attendee = attendees.find(a => a.id === attendeeId);
    if (!attendee || attendee.checkedIn) {
      return false;
    }

    setAttendees(prev => 
      prev.map(a => 
        a.id === attendeeId 
          ? { ...a, checkedIn: true, checkInTime: new Date().toISOString() }
          : a
      )
    );
    return true;
  };

  const getStats = (): EventStats => {
    const total = attendees.length;
    const checkedIn = attendees.filter(a => a.checkedIn).length;
    const pending = total - checkedIn;

    return { total, checkedIn, pending };
  };

  return {
    attendees,
    checkInAttendee,
    getStats
  };
};
