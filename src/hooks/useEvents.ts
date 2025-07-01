
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
      console.log('Fetching events...');
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching events:', error);
        toast({
          title: "Error",
          description: "Failed to fetch events",
          variant: "destructive",
        });
        return;
      }

      console.log('Fetched events:', data);
      setEvents(data || []);
      
      // Set the active event as current
      const activeEvent = data?.find(event => event.is_active);
      console.log('Found active event:', activeEvent);
      
      if (activeEvent) {
        console.log('Setting current event to:', activeEvent.name);
        setCurrentEvent(activeEvent);
      } else {
        console.log('No active event found, clearing current event');
        setCurrentEvent(null);
      }
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
