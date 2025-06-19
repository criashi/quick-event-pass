
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Attendee, EventStats } from "@/types/attendee";
import { useToast } from "@/hooks/use-toast";
import { useEventManagement } from "@/hooks/useEventManagement";

export const useSupabaseEventData = () => {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentEvent } = useEventManagement();

  const fetchAttendees = async () => {
    try {
      let query = supabase
        .from('attendees')
        .select('*')
        .order('created_at', { ascending: false });

      // If there's a current event, filter attendees by event_id
      if (currentEvent?.id) {
        query = query.eq('event_id', currentEvent.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching attendees:', error);
        toast({
          title: "Error",
          description: "Failed to fetch attendees data",
          variant: "destructive",
        });
        return;
      }

      setAttendees(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to connect to database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fixBadRecord = async () => {
    try {
      // Find and fix the specific record with business_area = "60014570"
      const { data: badRecord, error: fetchError } = await supabase
        .from('attendees')
        .select('id, business_area, employee_number, full_name')
        .eq('business_area', '60014570')
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching bad record:', fetchError);
        return;
      }

      if (badRecord) {
        const updates: any = {
          business_area: null, // Clear the invalid business area
        };

        // If employee_number is empty, move the business_area value there
        if (!badRecord.employee_number) {
          updates.employee_number = badRecord.business_area;
        }

        // Associate with current event if available
        if (currentEvent?.id) {
          updates.event_id = currentEvent.id;
        }

        const { error: updateError } = await supabase
          .from('attendees')
          .update(updates)
          .eq('id', badRecord.id);

        if (updateError) {
          console.error('Error updating bad record:', updateError);
        } else {
          console.log(`Fixed record for ${badRecord.full_name}: moved ${badRecord.business_area} from business_area to employee_number`);
          toast({
            title: "Record Fixed",
            description: `Fixed business area data for ${badRecord.full_name}`,
          });
          // Refresh data after fix
          await fetchAttendees();
        }
      }
    } catch (error) {
      console.error('Error fixing bad record:', error);
    }
  };

  // Re-fetch attendees when current event changes
  useEffect(() => {
    const initializeData = async () => {
      await fetchAttendees();
      // Automatically fix the bad record on component mount
      await fixBadRecord();
    };
    
    initializeData();
  }, [currentEvent?.id]); // Add currentEvent.id as dependency

  const checkInAttendee = async (attendeeId: string): Promise<boolean> => {
    try {
      const attendee = attendees.find(a => a.id === attendeeId);
      if (!attendee || attendee.checked_in) {
        toast({
          title: "Check-in Failed",
          description: attendee?.checked_in ? "Attendee already checked in" : "Attendee not found",
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from('attendees')
        .update({ 
          checked_in: true, 
          check_in_time: new Date().toISOString() 
        })
        .eq('id', attendeeId);

      if (error) {
        console.error('Error checking in attendee:', error);
        toast({
          title: "Check-in Failed",
          description: "Failed to update check-in status",
          variant: "destructive",
        });
        return false;
      }

      // Update local state
      setAttendees(prev => 
        prev.map(a => 
          a.id === attendeeId 
            ? { ...a, checked_in: true, check_in_time: new Date().toISOString() }
            : a
        )
      );

      toast({
        title: "Check-in Successful",
        description: `${attendee.full_name} has been checked in`,
      });

      return true;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to check in attendee",
        variant: "destructive",
      });
      return false;
    }
  };

  const getStats = (): EventStats => {
    const total = attendees.length;
    const checkedIn = attendees.filter(a => a.checked_in).length;
    const pending = total - checkedIn;

    return { total, checkedIn, pending };
  };

  return {
    attendees,
    loading,
    checkInAttendee,
    getStats,
    refreshData: fetchAttendees,
    currentEvent
  };
};
