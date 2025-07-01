
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Attendee, EventStats } from "@/types/attendee";
import { useToast } from "@/hooks/use-toast";
import { useEventManagement } from "@/hooks/useEventManagement";
import { useAuth } from "@/contexts/AuthContext";
import { logSecurityEvent, validateQRData } from "@/utils/security";

export const useSecureEventData = () => {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentEvent } = useEventManagement();
  const { user, profile } = useAuth();

  const fetchAttendees = async () => {
    if (!user) {
      console.error('User not authenticated');
      setLoading(false);
      return;
    }

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
        await logSecurityEvent('FETCH_ATTENDEES_ERROR', 'attendees', undefined, undefined, { error: error.message });
        toast({
          title: "Access Error",
          description: "Unable to access attendee data. Please check your permissions.",
          variant: "destructive",
        });
        return;
      }

      setAttendees(data || []);
      await logSecurityEvent('FETCH_ATTENDEES_SUCCESS', 'attendees');
    } catch (error) {
      console.error('Error:', error);
      await logSecurityEvent('FETCH_ATTENDEES_EXCEPTION', 'attendees', undefined, undefined, { error: String(error) });
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAttendees();
    }
  }, [currentEvent?.id, user]);

  const checkInAttendee = async (attendeeId: string, qrData?: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to perform this action",
        variant: "destructive",
      });
      return false;
    }

    // Validate QR data if provided
    if (qrData && !validateQRData(qrData)) {
      toast({
        title: "Invalid QR Code",
        description: "The scanned QR code appears to be invalid",
        variant: "destructive",
      });
      await logSecurityEvent('INVALID_QR_CODE_SCAN', 'attendees', attendeeId, undefined, { qrData });
      return false;
    }

    try {
      const attendee = attendees.find(a => a.id === attendeeId);
      if (!attendee) {
        toast({
          title: "Check-in Failed",
          description: "Attendee not found",
          variant: "destructive",
        });
        return false;
      }

      if (attendee.checked_in) {
        toast({
          title: "Already Checked In",
          description: `${attendee.full_name} is already checked in`,
          variant: "destructive",
        });
        return false;
      }

      const oldValues = { checked_in: attendee.checked_in, check_in_time: attendee.check_in_time };
      const newValues = { checked_in: true, check_in_time: new Date().toISOString() };

      const { error } = await supabase
        .from('attendees')
        .update(newValues)
        .eq('id', attendeeId);

      if (error) {
        console.error('Error checking in attendee:', error);
        await logSecurityEvent('CHECKIN_ERROR', 'attendees', attendeeId, oldValues, { error: error.message });
        toast({
          title: "Check-in Failed",
          description: "Unable to complete check-in. Please try again.",
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

      await logSecurityEvent('ATTENDEE_CHECKIN', 'attendees', attendeeId, oldValues, newValues);

      toast({
        title: "Check-in Successful",
        description: `${attendee.full_name} has been checked in`,
      });

      return true;
    } catch (error) {
      console.error('Error:', error);
      await logSecurityEvent('CHECKIN_EXCEPTION', 'attendees', attendeeId, undefined, { error: String(error) });
      toast({
        title: "Error",
        description: "An unexpected error occurred",
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
    currentEvent,
    isAdmin: profile?.role === 'admin'
  };
};
