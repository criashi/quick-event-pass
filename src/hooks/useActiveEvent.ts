
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/types/event";
import { useToast } from "@/hooks/use-toast";

export const useActiveEvent = () => {
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchActiveEvent = async () => {
    try {
      setLoading(true);
      console.log('fetchActiveEvent: Starting fetch...');
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      console.log('fetchActiveEvent: Raw database response:', { data, error });

      if (error) {
        console.error('fetchActiveEvent: Database error:', error);
        return;
      }

      console.log('fetchActiveEvent: Setting active event to:', data);
      setActiveEvent(data);
      
      // Force a re-render by logging the state after setting
      setTimeout(() => {
        console.log('fetchActiveEvent: Active event state after update:', data);
      }, 100);
      
    } catch (error) {
      console.error('fetchActiveEvent: Unexpected error:', error);
    } finally {
      setLoading(false);
      console.log('fetchActiveEvent: Finished, loading set to false');
    }
  };

  const setEventActive = async (eventId: string) => {
    try {
      console.log('setEventActive: Setting event active:', eventId);
      
      // First, deactivate all events
      const { error: deactivateError } = await supabase
        .from('events')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deactivateError) {
        console.error('setEventActive: Error deactivating events:', deactivateError);
        toast({
          title: "Error",
          description: "Failed to update events",
          variant: "destructive",
        });
        return false;
      }

      console.log('setEventActive: All events deactivated');

      // Then activate the selected event
      const { error: activateError } = await supabase
        .from('events')
        .update({ is_active: true })
        .eq('id', eventId);

      if (activateError) {
        console.error('setEventActive: Error activating event:', activateError);
        toast({
          title: "Error",
          description: "Failed to activate event",
          variant: "destructive",
        });
        return false;
      }

      console.log('setEventActive: Event activated successfully');

      // Immediately fetch the newly active event
      await fetchActiveEvent();
      
      toast({
        title: "Success",
        description: "Event activated successfully",
      });

      return true;
    } catch (error) {
      console.error('setEventActive: Unexpected error:', error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    console.log('useActiveEvent: useEffect triggered, calling fetchActiveEvent');
    fetchActiveEvent();
  }, []);

  // Log whenever activeEvent changes
  useEffect(() => {
    console.log('useActiveEvent: activeEvent state changed to:', activeEvent);
  }, [activeEvent]);

  console.log('useActiveEvent: Rendering hook, current activeEvent:', activeEvent, 'loading:', loading);

  return {
    activeEvent,
    loading,
    setEventActive,
    refetch: fetchActiveEvent
  };
};
