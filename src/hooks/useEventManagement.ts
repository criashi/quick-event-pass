
import { useEvents } from "./useEvents";
import { useEventOperations } from "./useEventOperations";
import { useFieldMappings } from "./useFieldMappings";

export const useEventManagement = () => {
  const { events, currentEvent, setCurrentEvent, loading, refreshEvents } = useEvents();
  const { createEvent, updateEvent, deleteEvent } = useEventOperations();
  const { fieldMappings, fetchFieldMappings, createFieldMapping } = useFieldMappings(currentEvent?.id);

  const handleCreateEvent = async (eventData: any) => {
    const result = await createEvent(eventData);
    if (result) {
      await refreshEvents();
    }
    return result;
  };

  const handleUpdateEvent = async (eventId: string, eventData: any) => {
    const result = await updateEvent(eventId, eventData);
    if (result) {
      await refreshEvents();
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
