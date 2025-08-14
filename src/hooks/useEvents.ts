
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/types/event";
import { useToast } from "@/hooks/use-toast";

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      console.log('fetchEvents: Starting to fetch events...');
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('fetchEvents: Error fetching events:', error);
        toast({
          title: "Error",
          description: "Failed to fetch events",
          variant: "destructive",
        });
        return;
      }

      console.log('fetchEvents: Fetched events:', data);
      setEvents(data || []);
      
      // Find and set the active event
      const activeEvent = data?.find(event => event.is_active);
      console.log('fetchEvents: Found active event:', activeEvent);
      
      setCurrentEvent(activeEvent || null);
      console.log('fetchEvents: Set currentEvent to:', activeEvent?.name || 'null');
    } catch (error) {
      console.error('fetchEvents: Unexpected error:', error);
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
    fetchEvents();
  }, []);

  return {
    events,
    currentEvent,
    setCurrentEvent,
    loading,
    refreshEvents: fetchEvents
  };
};
