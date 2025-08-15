import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Calendar, MapPin, Clock, Trash2 } from "lucide-react";
import { Event } from "@/types/event";
import EventForm from "./EventForm";
import FieldMappingManager from "./FieldMappingManager";
import EditEventDialog from "./EditEventDialog";
import DeleteEventDialog from "./DeleteEventDialog";
import { useEventList } from "@/hooks/useEventList";
import { useActiveEvent } from "@/hooks/useActiveEvent";
import { useFieldMappings } from "@/hooks/useFieldMappings";

const EventSetup = () => {
  const { events, loading: eventsLoading, refetch: refetchEvents } = useEventList();
  const { activeEvent, loading: activeLoading, setEventActive, refetch: refetchActive } = useActiveEvent();
  const { fieldMappings } = useFieldMappings(activeEvent?.id);
  
  const [showEventForm, setShowEventForm] = useState(false);
  const [showFieldMapping, setShowFieldMapping] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);

  // Add comprehensive logging
  console.log('EventSetup: Rendering component');
  console.log('EventSetup: activeEvent:', activeEvent);
  console.log('EventSetup: activeLoading:', activeLoading);
  console.log('EventSetup: events:', events);
  console.log('EventSetup: eventsLoading:', eventsLoading);

  const handleSetActiveEvent = async (eventId: string) => {
    console.log('handleSetActiveEvent: Starting to set active event:', eventId);
    const success = await setEventActive(eventId);
    if (success) {
      console.log('handleSetActiveEvent: Success, refreshing events list...');
      await refetchEvents();
      console.log('handleSetActiveEvent: Events list refreshed');
    }
  };

  const handleEventUpdated = async () => {
    console.log('handleEventUpdated: Refreshing both events and active event...');
    await Promise.all([refetchEvents(), refetchActive()]);
    console.log('handleEventUpdated: Both refreshed');
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
  };

  const handleDeleteEvent = (event: Event) => {
    setDeletingEvent(event);
  };

  if (eventsLoading || activeLoading) {
    console.log('EventSetup: Still loading...');
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Settings className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  console.log('EventSetup: About to render, activeEvent is:', activeEvent);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Current Active Event - FORCE DISPLAY WITH DETAILED LOGGING */}
      {activeEvent ? (
        <Card className="bg-gradient-to-r from-aum-purple to-aum-purple-300 text-primary-foreground">
          <CardHeader className="pb-3 md:pb-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg md:text-xl truncate">{activeEvent.name}</CardTitle>
                <Badge variant="secondary" className="bg-aum-orange text-primary-foreground mt-2 text-xs">
                  Active Event
                </Badge>
              </div>
              <Calendar className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-3 md:gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                <span className="text-sm truncate">{new Date(activeEvent.event_date + 'T00:00:00').toLocaleDateString()}</span>
              </div>
              {activeEvent.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                  <span className="text-sm truncate">{activeEvent.location}</span>
                </div>
              )}
              {activeEvent.start_time && (
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                  <span className="text-sm truncate">{activeEvent.start_time} - {activeEvent.end_time || 'End TBD'}</span>
                </div>
              )}
            </div>
            {activeEvent.description && (
              <p className="mt-3 text-sm md:text-base text-primary-foreground/90 line-clamp-2">{activeEvent.description}</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-dashed border-aum-gray-300">
          <CardContent className="p-6 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-aum-gray-400" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Active Event</h3>
            <p className="text-muted-foreground">No event is currently set as active. Set an event as active to manage it.</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <Button 
          onClick={() => setShowEventForm(true)}
          variant="light-primary"
          className="w-full sm:w-auto"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Event
        </Button>
        {activeEvent && (
          <Button 
            onClick={() => setShowFieldMapping(true)}
            variant="light-secondary"
            className="w-full sm:w-auto"
            size="sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Field Mappings
          </Button>
        )}
      </div>

      {/* All Events List */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg md:text-xl">All Events</CardTitle>
          <CardDescription className="text-sm">
            Manage your event configurations and switch between events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            {events.map((event) => (
              <div key={event.id} className="border rounded-lg p-3 md:p-4">
                <div className="space-y-3 md:space-y-0 md:flex md:items-center md:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-sm md:text-base truncate">{event.name}</h3>
                      {event.is_active && (
                        <Badge className="bg-aum-purple text-primary-foreground text-xs flex-shrink-0">Active</Badge>
                      )}
                    </div>
                    <div className="space-y-1 md:space-y-0 md:flex md:items-center md:gap-4 text-xs md:text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{new Date(event.event_date + 'T00:00:00').toLocaleDateString()}</span>
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-xs md:text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      onClick={() => handleEditEvent(event)}
                      size="sm"
                      variant="light-secondary"
                      className="text-xs h-8"
                    >
                      Edit
                    </Button>
                    {!event.is_active && (
                      <Button
                        onClick={() => handleSetActiveEvent(event.id)}
                        size="sm"
                        variant="light-secondary"
                        className="text-xs h-8 whitespace-nowrap"
                      >
                        Set Active
                      </Button>
                    )}
                    <Button
                      onClick={() => handleDeleteEvent(event)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 h-8 px-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Event Form Modal/Component */}
      {showEventForm && (
        <EventForm onClose={() => setShowEventForm(false)} onEventCreated={handleEventUpdated} />
      )}

      {/* Field Mapping Modal/Component */}
      {showFieldMapping && activeEvent && (
        <FieldMappingManager 
          event={activeEvent}
          fieldMappings={fieldMappings}
          onClose={() => setShowFieldMapping(false)} 
        />
      )}

      {/* Edit Event Dialog */}
      {editingEvent && (
        <EditEventDialog
          event={editingEvent}
          open={!!editingEvent}
          onClose={() => setEditingEvent(null)}
          onEventUpdated={handleEventUpdated}
        />
      )}

      {/* Delete Event Dialog */}
      {deletingEvent && (
        <DeleteEventDialog
          event={deletingEvent}
          open={!!deletingEvent}
          onClose={() => setDeletingEvent(null)}
          onEventDeleted={handleEventUpdated}
        />
      )}
    </div>
  );
};

export default EventSetup;
