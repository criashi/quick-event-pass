
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Event, FieldMapping } from "@/types/event";
import { useToast } from "@/hooks/use-toast";

export const useEventManagement = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
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

      setEvents(data || []);
      
      // Set the active event as current
      const activeEvent = data?.find(event => event.is_active);
      if (activeEvent) {
        setCurrentEvent(activeEvent);
        await fetchFieldMappings(activeEvent.id);
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

  const fetchFieldMappings = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('field_mappings')
        .select('*')
        .eq('event_id', eventId)
        .order('field_name');

      if (error) {
        console.error('Error fetching field mappings:', error);
        return;
      }

      setFieldMappings(data || []);
    } catch (error) {
      console.error('Error fetching field mappings:', error);
    }
  };

  const createEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // If this event should be active, deactivate others first
      if (eventData.is_active) {
        await supabase
          .from('events')
          .update({ is_active: false })
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all events
      }

      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (error) {
        console.error('Error creating event:', error);
        toast({
          title: "Error",
          description: "Failed to create event",
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "Success",
        description: "Event created successfully",
      });

      await fetchEvents();
      return data;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateEvent = async (eventId: string, eventData: Partial<Event>) => {
    try {
      // If this event should be active, deactivate others first
      if (eventData.is_active) {
        await supabase
          .from('events')
          .update({ is_active: false })
          .neq('id', eventId);
      }

      const { error } = await supabase
        .from('events')
        .update({ ...eventData, updated_at: new Date().toISOString() })
        .eq('id', eventId);

      if (error) {
        console.error('Error updating event:', error);
        toast({
          title: "Error",
          description: "Failed to update event",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Event updated successfully",
      });

      await fetchEvents();
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
      return false;
    }
  };

  const createFieldMapping = async (mappingData: Omit<FieldMapping, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('field_mappings')
        .insert([mappingData]);

      if (error) {
        console.error('Error creating field mapping:', error);
        toast({
          title: "Error",
          description: "Failed to create field mapping",
          variant: "destructive",
        });
        return false;
      }

      if (mappingData.event_id) {
        await fetchFieldMappings(mappingData.event_id);
      }
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    currentEvent,
    fieldMappings,
    loading,
    createEvent,
    updateEvent,
    createFieldMapping,
    fetchFieldMappings,
    refreshEvents: fetchEvents
  };
};
