import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Trash2 } from "lucide-react";
import { Event, FieldMapping } from "@/types/event";
import { useEventManagement } from "@/hooks/useEventManagement";

interface FieldMappingManagerProps {
  event: Event;
  fieldMappings: FieldMapping[];
  onClose: () => void;
}

const FieldMappingManager = ({ event, fieldMappings, onClose }: FieldMappingManagerProps) => {
  const { createFieldMapping } = useEventManagement();
  const [newMapping, setNewMapping] = useState({
    field_name: '',
    source_field_name: '',
    field_type: 'text',
    is_required: false
  });

  const standardFields = [
    'full_name',
    'email',
    'continental_email',
    'employee_number',
    'business_area',
    'vegetarian_vegan_option',
    'name'
  ];

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Yes/No' },
    { value: 'date', label: 'Date' },
    { value: 'time', label: 'Time' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await createFieldMapping({
      ...newMapping,
      event_id: event.id
    });
    
    if (success) {
      setNewMapping({
        field_name: '',
        source_field_name: '',
        field_type: 'text',
        is_required: false
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Field Mappings for {event.name}</CardTitle>
              <CardDescription>
                Map form fields from imports to standard database fields
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Existing Mappings */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Current Field Mappings</h3>
            {fieldMappings.length > 0 ? (
              <div className="space-y-3">
                {fieldMappings.map((mapping) => (
                  <div key={mapping.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="font-medium">{mapping.field_name}</span>
                        <span className="text-gray-500 mx-2">←</span>
                        <span className="text-continental-blue">{mapping.source_field_name}</span>
                      </div>
                      <Badge variant="secondary">{mapping.field_type}</Badge>
                      {mapping.is_required && (
                        <Badge variant="destructive">Required</Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No field mappings configured yet.</p>
            )}
          </div>

          {/* Add New Mapping */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add New Field Mapping</CardTitle>
              <CardDescription>
                Define how form fields should be mapped to database fields
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="field_name">Standard Database Field</Label>
                    <Select
                      value={newMapping.field_name}
                      onValueChange={(value) => setNewMapping(prev => ({ ...prev, field_name: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select standard field" />
                      </SelectTrigger>
                      <SelectContent>
                        {standardFields.map((field) => (
                          <SelectItem key={field} value={field}>
                            {field}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="source_field_name">Source Field Name</Label>
                    <Input
                      id="source_field_name"
                      value={newMapping.source_field_name}
                      onChange={(e) => setNewMapping(prev => ({ ...prev, source_field_name: e.target.value }))}
                      placeholder="Field name from form/CSV"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="field_type">Field Type</Label>
                    <Select
                      value={newMapping.field_type}
                      onValueChange={(value) => setNewMapping(prev => ({ ...prev, field_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_required"
                      checked={newMapping.is_required}
                      onCheckedChange={(checked) => setNewMapping(prev => ({ ...prev, is_required: checked }))}
                    />
                    <Label htmlFor="is_required">Required field</Label>
                  </div>
                </div>

                <Button type="submit" className="bg-continental-yellow text-continental-black hover:bg-continental-yellow/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Mapping
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="flex gap-3 pt-4">
            <Button onClick={onClose}>
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FieldMappingManager;
