
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Calendar, MapPin, Clock } from "lucide-react";
import { useEventManagement } from "@/hooks/useEventManagement";
import { Event } from "@/types/event";
import EventForm from "./EventForm";
import FieldMappingManager from "./FieldMappingManager";

const EventSetup = () => {
  const { events, currentEvent, fieldMappings, loading, updateEvent } = useEventManagement();
  const [showEventForm, setShowEventForm] = useState(false);
  const [showFieldMapping, setShowFieldMapping] = useState(false);

  const handleSetActiveEvent = async (eventId: string) => {
    await updateEvent(eventId, { is_active: true });
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
    <div className="space-y-6">
      {/* Current Active Event */}
      {currentEvent && (
        <Card className="bg-gradient-to-r from-continental-light-green to-continental-dark-green text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{currentEvent.name}</CardTitle>
                <Badge variant="secondary" className="bg-continental-yellow text-continental-black mt-2">
                  Active Event
                </Badge>
              </div>
              <Calendar className="h-8 w-8" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(currentEvent.event_date).toLocaleDateString()}</span>
              </div>
              {currentEvent.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{currentEvent.location}</span>
                </div>
              )}
              {currentEvent.start_time && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{currentEvent.start_time} - {currentEvent.end_time || 'End TBD'}</span>
                </div>
              )}
            </div>
            {currentEvent.description && (
              <p className="mt-3 text-continental-white/90">{currentEvent.description}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          onClick={() => setShowEventForm(true)}
          className="bg-continental-yellow text-continental-black hover:bg-continental-yellow/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Event
        </Button>
        {currentEvent && (
          <Button 
            onClick={() => setShowFieldMapping(true)}
            variant="outline"
            className="border-continental-gray2"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Field Mappings
          </Button>
        )}
      </div>

      {/* All Events List */}
      <Card>
        <CardHeader>
          <CardTitle>All Events</CardTitle>
          <CardDescription>
            Manage your event configurations and switch between events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{event.name}</h3>
                      {event.is_active && (
                        <Badge className="bg-continental-light-green text-white">Active</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(event.event_date).toLocaleDateString()}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                  {!event.is_active && (
                    <Button
                      onClick={() => handleSetActiveEvent(event.id)}
                      size="sm"
                      variant="outline"
                    >
                      Set Active
                    </Button>
                  )}
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
    </div>
  );
};

export default EventSetup;
