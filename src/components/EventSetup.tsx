
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Calendar, MapPin, Clock, Trash2 } from "lucide-react";
import { useEventManagement } from "@/hooks/useEventManagement";
import { Event } from "@/types/event";
import EventForm from "./EventForm";
import FieldMappingManager from "./FieldMappingManager";
import EditEventDialog from "./EditEventDialog";
import DeleteEventDialog from "./DeleteEventDialog";

const EventSetup = () => {
  const { events, currentEvent, fieldMappings, loading, updateEvent, refreshEvents } = useEventManagement();
  const [showEventForm, setShowEventForm] = useState(false);
  const [showFieldMapping, setShowFieldMapping] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);

  const handleSetActiveEvent = async (eventId: string) => {
    console.log('Setting active event:', eventId);
    const success = await updateEvent(eventId, { is_active: true });
    if (success) {
      console.log('Event updated successfully, refreshing events...');
      // Refresh events to get the latest data instead of forcing a page reload
      await refreshEvents();
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
  };

  const handleDeleteEvent = (event: Event) => {
    setDeletingEvent(event);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Settings className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Current Active Event */}
      {currentEvent && (
        <Card className="bg-gradient-to-r from-continental-light-green to-continental-dark-green text-white">
          <CardHeader className="pb-3 md:pb-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg md:text-xl truncate">{currentEvent.name}</CardTitle>
                <Badge variant="secondary" className="bg-continental-yellow text-continental-black mt-2 text-xs">
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
                <span className="text-sm truncate">{new Date(currentEvent.event_date).toLocaleDateString()}</span>
              </div>
              {currentEvent.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                  <span className="text-sm truncate">{currentEvent.location}</span>
                </div>
              )}
              {currentEvent.start_time && (
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                  <span className="text-sm truncate">{currentEvent.start_time} - {currentEvent.end_time || 'End TBD'}</span>
                </div>
              )}
            </div>
            {currentEvent.description && (
              <p className="mt-3 text-sm md:text-base text-continental-white/90 line-clamp-2">{currentEvent.description}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <Button 
          onClick={() => setShowEventForm(true)}
          className="bg-continental-yellow text-continental-black hover:bg-continental-yellow/90 w-full sm:w-auto"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Event
        </Button>
        {currentEvent && (
          <Button 
            onClick={() => setShowFieldMapping(true)}
            variant="outline"
            className="border-continental-gray2 w-full sm:w-auto"
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
                        <Badge className="bg-continental-light-green text-white text-xs flex-shrink-0">Active</Badge>
                      )}
                    </div>
                    <div className="space-y-1 md:space-y-0 md:flex md:items-center md:gap-4 text-xs md:text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{new Date(event.event_date).toLocaleDateString()}</span>
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
                      variant="outline"
                      className="text-xs h-8"
                    >
                      Edit
                    </Button>
                    {!event.is_active && (
                      <Button
                        onClick={() => handleSetActiveEvent(event.id)}
                        size="sm"
                        variant="outline"
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
        <EventForm onClose={() => setShowEventForm(false)} />
      )}

      {/* Field Mapping Modal/Component */}
      {showFieldMapping && currentEvent && (
        <FieldMappingManager 
          event={currentEvent}
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
        />
      )}

      {/* Delete Event Dialog */}
      {deletingEvent && (
        <DeleteEventDialog
          event={deletingEvent}
          open={!!deletingEvent}
          onClose={() => setDeletingEvent(null)}
        />
      )}
    </div>
  );
};

export default EventSetup;
