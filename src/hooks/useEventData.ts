
import { useState } from "react";
import { Attendee, EventStats } from "@/types/attendee";

// Mock data simulating Microsoft Forms responses with updated structure
const mockAttendees: Attendee[] = [
  {
    id: "1",
    full_name: "John Doe",
    continental_email: "john.doe@continental.com",
    employee_number: "60001234",
    business_area: "Engineering",
    vegetarian_vegan_option: "No",
    start_time: "2024-01-15T10:30:00Z",
    checked_in: false
  },
  {
    id: "2",
    full_name: "Jane Smith",
    continental_email: "jane.smith@continental.com",
    employee_number: "60001235",
    business_area: "Marketing",
    vegetarian_vegan_option: "Yes",
    start_time: "2024-01-15T11:45:00Z",
    checked_in: true,
    check_in_time: "2024-01-16T09:15:00Z"
  },
  {
    id: "3",
    full_name: "Michael Johnson",
    continental_email: "michael.johnson@continental.com",
    employee_number: "60001236",
    business_area: "Sales",
    start_time: "2024-01-15T14:20:00Z",
    checked_in: false
  },
  {
    id: "4",
    full_name: "Sarah Williams",
    continental_email: "sarah.williams@continental.com",
    employee_number: "60001237",
    business_area: "HR",
    vegetarian_vegan_option: "Yes",
    start_time: "2024-01-15T16:00:00Z",
    checked_in: true,
    check_in_time: "2024-01-16T08:45:00Z"
  },
  {
    id: "5",
    full_name: "David Brown",
    continental_email: "david.brown@continental.com",
    employee_number: "60001238",
    business_area: "Engineering",
    start_time: "2024-01-16T08:30:00Z",
    checked_in: false
  },
  {
    id: "6",
    full_name: "Emily Davis",
    continental_email: "emily.davis@continental.com",
    employee_number: "60001239",
    business_area: "Marketing",
    vegetarian_vegan_option: "Yes",
    start_time: "2024-01-16T09:00:00Z",
    checked_in: false
  },
  {
    id: "7",
    full_name: "Chris Wilson",
    continental_email: "chris.wilson@continental.com",
    employee_number: "60001240",
    business_area: "Finance",
    start_time: "2024-01-16T09:30:00Z",
    checked_in: true,
    check_in_time: "2024-01-16T09:35:00Z"
  },
  {
    id: "8",
    full_name: "Lisa Anderson",
    continental_email: "lisa.anderson@continental.com",
    employee_number: "60001241",
    business_area: "Operations",
    start_time: "2024-01-16T10:00:00Z",
    checked_in: false
  }
];

export const useEventData = () => {
  const [attendees, setAttendees] = useState<Attendee[]>(mockAttendees);

  const checkInAttendee = (attendeeId: string): boolean => {
    const attendee = attendees.find(a => a.id === attendeeId);
    if (!attendee || attendee.checked_in) {
      return false;
    }

    setAttendees(prev => 
      prev.map(a => 
        a.id === attendeeId 
          ? { ...a, checked_in: true, check_in_time: new Date().toISOString() }
          : a
      )
    );
    return true;
  };

  const getStats = (): EventStats => {
    const total = attendees.length;
    const checkedIn = attendees.filter(a => a.checked_in).length;
    const pending = total - checkedIn;

    return { total, checkedIn, pending };
  };

  return {
    attendees,
    checkInAttendee,
    getStats
  };
};
