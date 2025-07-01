
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/types/event";
import { useToast } from "@/hooks/use-toast";

export const useEventCRUD = () => {
  const { toast } = useToast();

  const createEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('createEvent: Starting event creation with data:', eventData);
      
      // Check current user authentication status
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('createEvent: Current user:', user);
      console.log('createEvent: User error:', userError);
      
      if (!user) {
        console.error('createEvent: No authenticated user found');
        toast({
          title: "Authentication Required",
          description: "You must be logged in to create events",
          variant: "destructive",
        });
        return null;
      }

      // If this event should be active, deactivate others first
      if (eventData.is_active) {
        console.log('createEvent: Deactivating other events first...');
        const { error: deactivateError } = await supabase
          .from('events')
          .update({ is_active: false })
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (deactivateError) {
          console.error('createEvent: Error deactivating other events:', deactivateError);
        } else {
          console.log('createEvent: Successfully deactivated other events');
        }
      }

      console.log('createEvent: Attempting to insert event...');
      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      console.log('createEvent: Insert response - data:', data, 'error:', error);

      if (error) {
        console.error('createEvent: Database error:', error);
        
        // Provide more specific error messages
        let errorMessage = "Failed to create event";
        if (error.code === '42501') {
          errorMessage = "You don't have permission to create events. Please check your user role.";
        } else if (error.code === '22007') {
          errorMessage = "Invalid time format provided";
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        return null;
      }

      console.log('createEvent: Event created successfully:', data);
      toast({
        title: "Success",
        description: "Event created successfully",
      });

      return data;
    } catch (error) {
      console.error('createEvent: Unexpected error:', error);
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
      // If setting as active, first deactivate all other events
      if (eventData.is_active) {
        const { error: deactivateError } = await supabase
          .from('events')
          .update({ is_active: false })
          .neq('id', eventId);
          
        if (deactivateError) {
          console.error('Error deactivating other events:', deactivateError);
          throw deactivateError;
        }
      }

      // Now update the target event
      const { error: updateError } = await supabase
        .from('events')
        .update({ ...eventData, updated_at: new Date().toISOString() })
        .eq('id', eventId);

      if (updateError) {
        console.error('Error updating target event:', updateError);
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

  const deleteEvent = async (eventId: string) => {
    try {
      // Delete field mappings first
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
        description: "Event deleted successfully",
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
