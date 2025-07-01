
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FieldMapping } from "@/types/event";
import { useToast } from "@/hooks/use-toast";

export const useFieldMappings = (eventId?: string) => {
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const { toast } = useToast();

  const fetchFieldMappings = async (targetEventId?: string) => {
    const queryEventId = targetEventId || eventId;
    if (!queryEventId) return;

    try {
      const { data, error } = await supabase
        .from('field_mappings')
        .select('*')
        .eq('event_id', queryEventId)
        .order('field_name');

      if (error) {
        console.error('Error fetching field mappings:', error);
        return;
      }

      setFieldMappings(data || []);
    } catch (error) {
      console.error('Error fetching field mappings:', error);
    }
  };

  const createFieldMapping = async (mappingData: Omit<FieldMapping, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('field_mappings')
        .insert([mappingData]);

      if (error) {
        console.error('Error creating field mapping:', error);
        toast({
          title: "Error",
          description: "Failed to create field mapping",
          variant: "destructive",
        });
        return false;
      }

      if (mappingData.event_id) {
        await fetchFieldMappings(mappingData.event_id);
      }
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchFieldMappings(eventId);
    }
  }, [eventId]);

  return {
    fieldMappings,
    fetchFieldMappings,
    createFieldMapping
  };
};
