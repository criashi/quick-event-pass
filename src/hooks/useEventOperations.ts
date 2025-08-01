
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/types/event";
import { useToast } from "@/hooks/use-toast";

export const useEventOperations = () => {
  const { toast } = useToast();

  const createEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // If this event should be active, deactivate others first
      if (eventData.is_active) {
        await supabase
          .from('events')
          .update({ is_active: false })
          .neq('id', '00000000-0000-0000-0000-000000000000');
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
      console.log('updateEvent: Starting update for', eventId, 'with data:', eventData);
      
      // If setting as active, first deactivate all other events
      if (eventData.is_active) {
        console.log('updateEvent: Deactivating other events first...');
        const { error: deactivateError } = await supabase
          .from('events')
          .update({ is_active: false })
          .neq('id', eventId);
          
        if (deactivateError) {
          console.error('updateEvent: Error deactivating other events:', deactivateError);
          throw deactivateError;
        }
        console.log('updateEvent: Other events deactivated');
      }

      // Now update the target event
      console.log('updateEvent: Updating target event...');
      const { error: updateError } = await supabase
        .from('events')
        .update({ ...eventData, updated_at: new Date().toISOString() })
        .eq('id', eventId);

      if (updateError) {
        console.error('updateEvent: Error updating target event:', updateError);
        toast({
          title: "Error",
          description: "Failed to update event",
          variant: "destructive",
        });
        return false;
      }

      console.log('updateEvent: Target event updated successfully');

      toast({
        title: "Success",
        description: "Event updated successfully",
      });

      return true;
    } catch (error) {
      console.error('updateEvent: Unexpected error:', error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      // First, get a count of attendees for this event
      const { count: attendeeCount, error: countError } = await supabase
        .from('attendees')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      if (countError) {
        console.error('Error counting attendees:', countError);
        toast({
          title: "Error",
          description: "Failed to check event data",
          variant: "destructive",
        });
        return false;
      }

      // Delete field mappings first (due to foreign key constraints)
      const { error: mappingsError } = await supabase
        .from('field_mappings')
        .delete()
        .eq('event_id', eventId);

      if (mappingsError) {
        console.error('Error deleting field mappings:', mappingsError);
        toast({
          title: "Error",
          description: "Failed to delete event field mappings",
          variant: "destructive",
        });
        return false;
      }

      // Delete attendees for this event
      const { error: attendeesError } = await supabase
        .from('attendees')
        .delete()
        .eq('event_id', eventId);

      if (attendeesError) {
        console.error('Error deleting attendees:', attendeesError);
        toast({
          title: "Error",
          description: "Failed to delete event attendees",
          variant: "destructive",
        });
        return false;
      }

      // Finally, delete the event
      const { error: eventError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (eventError) {
        console.error('Error deleting event:', eventError);
        toast({
          title: "Error",
          description: "Failed to delete event",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: `Event deleted successfully. ${attendeeCount || 0} attendee records were also removed.`,
      });

      return true;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    createEvent,
    updateEvent,
    deleteEvent
  };
};
