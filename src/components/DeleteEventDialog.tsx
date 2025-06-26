
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { Event } from "@/types/event";
import { useEventManagement } from "@/hooks/useEventManagement";

interface DeleteEventDialogProps {
  event: Event;
  open: boolean;
  onClose: () => void;
}

const DeleteEventDialog = ({ event, open, onClose }: DeleteEventDialogProps) => {
  const { deleteEvent } = useEventManagement();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== event.name) {
      return;
    }

    setLoading(true);
    const success = await deleteEvent(event.id);
    
    if (success) {
      onClose();
      setConfirmText('');
    }
    
    setLoading(false);
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Event
          </DialogTitle>
          <DialogDescription className="text-left">
            This action cannot be undone. This will permanently delete the event and all associated data including:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2">What will be deleted:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Event: <strong>{event.name}</strong></li>
              <li>• All attendee registrations for this event</li>
              <li>• All field mappings for this event</li>
              <li>• All check-in data for this event</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">
              To confirm, type the event name: <strong>{event.name}</strong>
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Enter event name to confirm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={confirmText !== event.name || loading}
          >
            {loading ? 'Deleting...' : 'Delete Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteEventDialog;
