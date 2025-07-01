
import { useEvents } from "./useEvents";
import { useEventOperations } from "./useEventOperations";
import { useFieldMappings } from "./useFieldMappings";

export const useEventManagement = () => {
  const { events, currentEvent, setCurrentEvent, loading, refreshEvents } = useEvents();
  const { createEvent, updateEvent, deleteEvent } = useEventOperations();
  const { fieldMappings, fetchFieldMappings, createFieldMapping } = useFieldMappings(currentEvent?.id);

  console.log('useEventManagement - currentEvent:', currentEvent);
  console.log('useEventManagement - events count:', events.length);

  const handleCreateEvent = async (eventData: any) => {
    const result = await createEvent(eventData);
    if (result) {
      console.log('Event created, refreshing events...');
      await refreshEvents();
    }
    return result;
  };

  const handleUpdateEvent = async (eventId: string, eventData: any) => {
    console.log('Updating event:', eventId, eventData);
    const result = await updateEvent(eventId, eventData);
    if (result) {
      console.log('Event updated successfully, refreshing events...');
      // Force an immediate refresh to get the latest data
      await refreshEvents();
      
      // If we're setting this event as active, immediately update the current event
      if (eventData.is_active) {
        const updatedEvent = events.find(e => e.id === eventId);
        if (updatedEvent) {
          console.log('Manually setting current event to updated event');
          setCurrentEvent({ ...updatedEvent, ...eventData });
        }
      }
    }
    return result;
  };

  const handleDeleteEvent = async (eventId: string) => {
    const result = await deleteEvent(eventId);
    if (result) {
      await refreshEvents();
    }
    return result;
  };

  return {
    events,
    currentEvent,
    setCurrentEvent,
    fieldMappings,
    loading,
    createEvent: handleCreateEvent,
    updateEvent: handleUpdateEvent,
    deleteEvent: handleDeleteEvent,
    createFieldMapping,
    fetchFieldMappings,
    refreshEvents
  };
};
