import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Attendee } from "@/types/attendee";
import { useEventManagement } from "@/hooks/useEventManagement";

interface CSVImportProps {
  onImportComplete: () => void;
}

interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: string[];
}

interface ValidatedAttendee {
  full_name: string;
  continental_email: string;
  employee_number?: string;
  business_area?: string;
  vegetarian_vegan_option?: string;
  checked_in: boolean;
  event_id?: string;
}

const CSVImport = ({ onImportComplete }: CSVImportProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { currentEvent } = useEventManagement();

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1);

    return rows.map(row => {
      const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidEmployeeNumber = (empNum: string): boolean => {
    // Employee numbers should be numeric and typically 8-9 digits for Continental
    const cleanNum = empNum.replace(/\D/g, '');
    return cleanNum.length >= 6 && cleanNum.length <= 10;
  };

  const isValidBusinessArea = (area: string): boolean => {
    // Business areas should not be purely numeric
    const numericPattern = /^\d+$/;
    return !numericPattern.test(area.trim()) && area.length > 2;
  };

  const normalizeAttendeeData = (csvRow: any): ValidatedAttendee | null => {
    // Map common CSV column names to our attendee structure
    const mapping: Record<string, string> = {
      // Standard formats
      'Name': 'full_name',
      'Full Name': 'full_name',
      'name': 'full_name',
      'full_name': 'full_name',
      'Email': 'continental_email',
      'Continental Email': 'continental_email',
      'email': 'continental_email',
      'continental_email': 'continental_email',
      'Employee Number': 'employee_number',
      'employee_number': 'employee_number',
      'Business Area': 'business_area',
      'business_area': 'business_area',
      'Vegetarian/Vegan Option': 'vegetarian_vegan_option',
      'vegetarian_vegan_option': 'vegetarian_vegan_option',
      
      // Microsoft Forms specific column names
      'Your Name (first and last)�': 'full_name',
      'Your Name (first and last)': 'full_name',
      'Name (first and last)': 'full_name',
      'Please write your Continental email address:': 'continental_email',
      'Employee Number (e.g. 60001234)': 'employee_number',
      'Please Select Business Area': 'business_area',
      'Do you require a vegetarian or vegan food option?': 'vegetarian_vegan_option',
    };

    const normalized: Partial<ValidatedAttendee> = {
      checked_in: false,
      event_id: currentEvent?.id, // Associate with current event
    };

    // Map CSV fields to our structure
    Object.entries(csvRow).forEach(([key, value]) => {
      const mappedKey = mapping[key];
      if (mappedKey && value && typeof value === 'string') {
        (normalized as any)[mappedKey] = value.trim();
      }
    });

    // Validate required fields
    if (!normalized.full_name || !normalized.continental_email) {
      return null;
    }

    // Validate email format
    if (!isValidEmail(normalized.continental_email)) {
      console.warn(`Invalid email format: ${normalized.continental_email}`);
      return null;
    }

    // Validate and clean employee number
    if (normalized.employee_number && !isValidEmployeeNumber(normalized.employee_number)) {
      console.warn(`Invalid employee number: ${normalized.employee_number}`);
      // Set to undefined rather than rejecting the whole record
      normalized.employee_number = undefined;
    }

    // Validate business area
    if (normalized.business_area && !isValidBusinessArea(normalized.business_area)) {
      console.warn(`Invalid business area (appears to be numeric): ${normalized.business_area}`);
      // Set to undefined rather than rejecting the whole record
      normalized.business_area = undefined;
    }

    return {
      full_name: normalized.full_name,
      continental_email: normalized.continental_email,
      employee_number: normalized.employee_number,
      business_area: normalized.business_area,
      vegetarian_vegan_option: normalized.vegetarian_vegan_option,
      checked_in: false,
      event_id: normalized.event_id,
    };
  };

  const cleanupExistingData = async () => {
    try {
      // Find and fix records where business_area is numeric (employee numbers)
      const { data: badRecords, error: fetchError } = await supabase
        .from('attendees')
        .select('id, business_area, employee_number')
        .not('business_area', 'is', null);

      if (fetchError) {
        console.error('Error fetching records for cleanup:', fetchError);
        return;
      }

      const recordsToFix = badRecords?.filter(record => 
        record.business_area && /^\d+$/.test(record.business_area)
      ) || [];

      for (const record of recordsToFix) {
        const updates: any = {
          business_area: null, // Clear the invalid business area
        };

        // If employee_number is empty and business_area looks like an employee number, move it
        if (!record.employee_number && isValidEmployeeNumber(record.business_area)) {
          updates.employee_number = record.business_area;
        }

        const { error: updateError } = await supabase
          .from('attendees')
          .update(updates)
          .eq('id', record.id);

        if (updateError) {
          console.error(`Error updating record ${record.id}:`, updateError);
        } else {
          console.log(`Fixed record ${record.id}: moved ${record.business_area} from business_area to employee_number`);
        }
      }

      if (recordsToFix.length > 0) {
        toast({
          title: "Data Cleanup",
          description: `Fixed ${recordsToFix.length} records with invalid business area data`,
        });
      }
    } catch (error) {
      console.error('Error during data cleanup:', error);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!currentEvent) {
      toast({
        title: "No Active Event",
        description: "Please set up an active event before importing attendees",
        variant: "destructive",
      });
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      // First, clean up any existing bad data
      await cleanupExistingData();

      const csvText = await file.text();
      const csvData = parseCSV(csvText);

      if (csvData.length === 0) {
        toast({
          title: "Empty File",
          description: "The CSV file appears to be empty or invalid",
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }

      // Get existing attendees to check for duplicates (scoped to current event)
      const { data: existingAttendees, error: fetchError } = await supabase
        .from('attendees')
        .select('continental_email, full_name')
        .eq('event_id', currentEvent.id);

      if (fetchError) {
        throw fetchError;
      }

      const existingEmails = new Set(existingAttendees?.map(a => a.continental_email.toLowerCase()) || []);
      const existingNames = new Set(existingAttendees?.map(a => a.full_name.toLowerCase()) || []);

      const result: ImportResult = {
        total: csvData.length,
        imported: 0,
        skipped: 0,
        errors: []
      };

      // Process each row
      for (const row of csvData) {
        try {
          const attendee = normalizeAttendeeData(row);

          // Check if validation failed
          if (!attendee) {
            // Try to get the name from various possible columns for better error reporting
            const name = row['Name (first and last)'] || row['Name'] || row['Full Name'] || row['name'] || row['full_name'] || 'Unknown';
            const email = row['Email'] || row['Continental Email'] || row['Please write your Continental email address:'] || row['email'] || 'Unknown email';
            
            // Determine specific validation failure reason
            let reason = 'Missing required fields';
            if (!name || name === 'Unknown') reason = 'Missing name';
            else if (!email || email === 'Unknown email') reason = 'Missing email';
            else if (email !== 'Unknown email' && !isValidEmail(email)) reason = `Invalid email format: ${email}`;
            
            result.errors.push(`❌ Failed to import "${name}" - ${reason}`);
            continue;
          }

          // Check for duplicates within the current event
          const emailLower = attendee.continental_email.toLowerCase();
          const nameLower = attendee.full_name.toLowerCase();
          
          if (existingEmails.has(emailLower) || existingNames.has(nameLower)) {
            result.skipped++;
            continue;
          }

          // Insert new attendee
          const { error: insertError } = await supabase
            .from('attendees')
            .insert([attendee]);

          if (insertError) {
            result.errors.push(`Failed to import ${attendee.full_name}: ${insertError.message}`);
          } else {
            result.imported++;
            existingEmails.add(emailLower);
            existingNames.add(nameLower);
          }
        } catch (error) {
          result.errors.push(`Error processing row: ${error}`);
        }
      }

      setImportResult(result);
      onImportComplete();

      if (result.imported > 0) {
        toast({
          title: "Import Successful",
          description: `Imported ${result.imported} new attendees for ${currentEvent.name}, skipped ${result.skipped} duplicates`,
        });
      } else if (result.skipped > 0) {
        toast({
          title: "No New Records",
          description: `All ${result.skipped} records were duplicates and skipped`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "Failed to process CSV file",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            CSV Import
            {currentEvent && (
              <Badge variant="secondary" className="ml-2">
                {currentEvent.name}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Import attendee data from CSV files for the current active event. Duplicate entries will be automatically skipped.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!currentEvent && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <p className="text-yellow-800 font-medium">No Active Event</p>
              </div>
              <p className="text-yellow-700 text-sm mt-1">
                Please set up and activate an event in Event Setup before importing attendees.
              </p>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Choose CSV File
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Upload a CSV file with attendee information
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={isImporting || !currentEvent}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting || !currentEvent}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Select CSV File
                  </>
                )}
              </Button>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">CSV Format Requirements:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Required columns: Name (or Full Name), Email (or Continental Email)</li>
                <li>• Optional columns: Employee Number, Business Area, Vegetarian/Vegan Option</li>
                <li>• First row should contain column headers</li>
                <li>• Supports Microsoft Forms exports with long column names</li>
                <li>• Data validation prevents malformed records</li>
                <li>• Duplicate entries (same email or name) within the event will be skipped</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {importResult && (
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              {importResult.imported > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-700">{importResult.total}</p>
                <p className="text-sm text-gray-500">Total Records</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                <p className="text-sm text-gray-500">Imported</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{importResult.skipped}</p>
                <p className="text-sm text-gray-500">Skipped (Duplicates)</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
                <div className="bg-red-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                  {importResult.errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-700 mb-1">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mt-4">
              <Badge 
                variant="secondary" 
                className={importResult.imported > 0 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}
              >
                {importResult.imported > 0 ? 'Import Completed' : 'No New Records'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CSVImport;
