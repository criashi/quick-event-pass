
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
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching active event:', error);
        return;
      }

      setActiveEvent(data);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const setEventActive = async (eventId: string) => {
    try {
      // First, deactivate all events
      const { error: deactivateError } = await supabase
        .from('events')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deactivateError) {
        console.error('Error deactivating events:', deactivateError);
        toast({
          title: "Error",
          description: "Failed to update events",
          variant: "destructive",
        });
        return false;
      }

      // Then activate the selected event
      const { error: activateError } = await supabase
        .from('events')
        .update({ is_active: true })
        .eq('id', eventId);

      if (activateError) {
        console.error('Error activating event:', activateError);
        toast({
          title: "Error",
          description: "Failed to activate event",
          variant: "destructive",
        });
        return false;
      }

      // Refresh the active event
      await fetchActiveEvent();
      
      toast({
        title: "Success",
        description: "Event activated successfully",
      });

      return true;
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchActiveEvent();
  }, []);

  return {
    activeEvent,
    loading,
    setEventActive,
    refetch: fetchActiveEvent
  };
};
