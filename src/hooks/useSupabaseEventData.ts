
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Attendee, EventStats } from "@/types/attendee";
import { useToast } from "@/hooks/use-toast";

export const useSupabaseEventData = () => {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAttendees = async () => {
    try {
      const { data, error } = await supabase
        .from('attendees')
        .select('*')
        .order('created_at', { ascending: false });

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

  useEffect(() => {
    fetchAttendees();
  }, []);

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
    refreshData: fetchAttendees
  };
};
