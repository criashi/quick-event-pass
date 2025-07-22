import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, User, Mail, Building, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddAttendeeDialogProps {
  eventId?: string;
  onAttendeeAdded: () => void;
}

const AddAttendeeDialog = ({ eventId, onAttendeeAdded }: AddAttendeeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    full_name: "",
    continental_email: "",
    email: "",
    employee_number: "",
    business_area: "",
    vegetarian_vegan_option: "No"
  });

  const resetForm = () => {
    setFormData({
      full_name: "",
      continental_email: "",
      email: "",
      employee_number: "",
      business_area: "",
      vegetarian_vegan_option: "No"
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim() || !formData.continental_email.trim()) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in the full name and Continental email",
        variant: "destructive",
      });
      return;
    }

    if (!eventId) {
      toast({
        title: "No Active Event",
        description: "Please select an active event first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('attendees')
        .insert({
          event_id: eventId,
          full_name: formData.full_name.trim(),
          continental_email: formData.continental_email.trim().toLowerCase(),
          email: formData.email.trim() || formData.continental_email.trim().toLowerCase(),
          employee_number: formData.employee_number.trim() || null,
          business_area: formData.business_area.trim() || null,
          vegetarian_vegan_option: formData.vegetarian_vegan_option,
          checked_in: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Attendee Added",
        description: `${formData.full_name} has been successfully added to the event`,
      });

      resetForm();
      setOpen(false);
      onAttendeeAdded();
      
    } catch (error) {
      console.error('Error adding attendee:', error);
      toast({
        title: "Error",
        description: "Failed to add attendee. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Attendee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add New Attendee
          </DialogTitle>
          <DialogDescription>
            Manually add an attendee who didn't register via the form
          </DialogDescription>
        </DialogHeader>
        
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name *
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="continental_email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Continental Email *
                </Label>
                <Input
                  id="continental_email"
                  type="email"
                  value={formData.continental_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, continental_email: e.target.value }))}
                  placeholder="name@continental.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Personal Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="personal@email.com (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee_number" className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Employee Number
                </Label>
                <Input
                  id="employee_number"
                  value={formData.employee_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, employee_number: e.target.value }))}
                  placeholder="Employee number (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_area" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Business Area
                </Label>
                <Input
                  id="business_area"
                  value={formData.business_area}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_area: e.target.value }))}
                  placeholder="Business area (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vegetarian_option">Vegetarian/Vegan Option</Label>
                <Select
                  value={formData.vegetarian_vegan_option}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, vegetarian_vegan_option: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  {loading ? "Adding..." : "Add Attendee"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default AddAttendeeDialog;