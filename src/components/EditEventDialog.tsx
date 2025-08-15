
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Event } from "@/types/event";
import { useEventCRUD } from "@/hooks/useEventCRUD";

interface EditEventDialogProps {
  event: Event;
  open: boolean;
  onClose: () => void;
  onEventUpdated: () => void;
}

const EditEventDialog = ({ event, open, onClose, onEventUpdated }: EditEventDialogProps) => {
  const { updateEvent } = useEventCRUD();
  
  // Helper function to format date for input field (prevents timezone shift)
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00'); // Force local timezone
    return date.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    name: event.name,
    description: event.description || '',
    event_date: formatDateForInput(event.event_date),
    start_time: event.start_time || '',
    end_time: event.end_time || '',
    location: event.location || '',
    timezone: event.timezone,
    is_active: event.is_active,
    scavenger_hunt_enabled: event.scavenger_hunt_enabled || false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const success = await updateEvent(event.id, formData);
    
    if (success) {
      onEventUpdated();
      onClose();
    }
    
    setLoading(false);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Make changes to the event details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Event Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_date">Event Date *</Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) => handleInputChange('event_date', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleInputChange('start_time', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => handleInputChange('end_time', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={formData.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
              placeholder="e.g., America/New_York"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
            <Label htmlFor="is_active">Set as Active Event</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="scavenger_hunt_enabled"
              checked={formData.scavenger_hunt_enabled}
              onCheckedChange={(checked) => handleInputChange('scavenger_hunt_enabled', checked)}
            />
            <Label htmlFor="scavenger_hunt_enabled">Enable Scavenger Hunt</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="light-secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="light-primary" disabled={loading}>
              {loading ? 'Updating...' : 'Update Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEventDialog;
