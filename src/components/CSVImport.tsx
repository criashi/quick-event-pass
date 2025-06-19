
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle } from "lucide-react";
import { Event } from "@/types/event";

interface CSVImportProps {
  onImportComplete: () => void;
  currentEvent?: Event | null;
}

const CSVImport = ({ onImportComplete, currentEvent }: CSVImportProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setImportResults(null);
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }

    return data;
  };

  const mapCSVData = (csvRow: Record<string, string>) => {
    // Standard field mappings - you can make this configurable later
    const mappings: Record<string, string[]> = {
      full_name: ['full_name', 'name', 'Full Name', 'Name', 'fullname'],
      continental_email: ['continental_email', 'email', 'Continental Email', 'Email', 'continentalemail'],
      employee_number: ['employee_number', 'Employee Number', 'employeenumber', 'emp_id'],
      business_area: ['business_area', 'Business Area', 'businessarea', 'department'],
      vegetarian_vegan_option: ['vegetarian_vegan_option', 'Dietary Requirements', 'diet', 'dietary']
    };

    const mapped: any = {
      checked_in: false,
      event_id: currentEvent?.id || null
    };

    for (const [targetField, possibleNames] of Object.entries(mappings)) {
      for (const possibleName of possibleNames) {
        if (csvRow[possibleName] !== undefined) {
          mapped[targetField] = csvRow[possibleName];
          break;
        }
      }
    }

    // Ensure required fields have default values
    if (!mapped.full_name) {
      mapped.full_name = mapped.name || 'Unknown';
    }
    if (!mapped.continental_email) {
      mapped.continental_email = mapped.email || '';
    }

    // Ensure required fields are not empty strings
    if (!mapped.full_name || mapped.full_name.trim() === '') {
      mapped.full_name = 'Unknown';
    }
    if (!mapped.continental_email || mapped.continental_email.trim() === '') {
      mapped.continental_email = 'no-email@example.com';
    }

    return mapped;
  };

  const handleImport = async () => {
    if (!file) return;

    if (!currentEvent) {
      toast({
        title: "No Active Event",
        description: "Please select an active event before importing attendees",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setImportResults(null);

    try {
      const text = await file.text();
      const csvData = parseCSV(text);
      
      console.log('Parsed CSV data:', csvData);

      if (csvData.length === 0) {
        toast({
          title: "No data found",
          description: "The CSV file appears to be empty or invalid",
          variant: "destructive",
        });
        setImporting(false);
        return;
      }

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (const row of csvData) {
        try {
          const mappedData = mapCSVData(row);
          console.log('Mapped data:', mappedData);

          const { error } = await supabase
            .from('attendees')
            .insert(mappedData);

          if (error) {
            console.error('Error inserting row:', error, mappedData);
            failedCount++;
            errors.push(`Failed to import ${mappedData.full_name || 'unknown'}: ${error.message}`);
          } else {
            successCount++;
          }
        } catch (err) {
          console.error('Error processing row:', err, row);
          failedCount++;
          errors.push(`Failed to process row: ${JSON.stringify(row)}`);
        }
      }

      setImportResults({
        success: successCount,
        failed: failedCount,
        errors: errors.slice(0, 5) // Show only first 5 errors
      });

      if (successCount > 0) {
        toast({
          title: "Import completed",
          description: `Successfully imported ${successCount} attendees to ${currentEvent.name}`,
        });
        onImportComplete();
      }

      if (failedCount > 0) {
        toast({
          title: "Some imports failed",
          description: `${failedCount} records failed to import`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: "An error occurred while importing the CSV file",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Attendees from CSV
          </CardTitle>
          <CardDescription>
            {currentEvent 
              ? `Import attendees for: ${currentEvent.name}`
              : "No active event selected. Please set up an event first."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={importing || !currentEvent}
            />
            <p className="text-sm text-gray-600">
              Select a CSV file containing attendee information
            </p>
          </div>

          {file && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">{file.name}</span>
            </div>
          )}

          <Button 
            onClick={handleImport} 
            disabled={!file || importing || !currentEvent}
            className="w-full"
          >
            {importing ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {importResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-green-600">✓ {importResults.success} records imported successfully</p>
              {importResults.failed > 0 && (
                <p className="text-red-600">✗ {importResults.failed} records failed</p>
              )}
              
              {importResults.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-red-600 mb-2">Errors:</h4>
                  <div className="space-y-1">
                    {importResults.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CSVImport;
