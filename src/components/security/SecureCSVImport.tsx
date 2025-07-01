
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, AlertTriangle, Shield } from 'lucide-react';
import { validateFileType, validateFileSize, validateCSVHeaders, sanitizeText, validateEmail, logSecurityEvent } from '@/utils/security';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SecureCSVImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const validateFile = (selectedFile: File): boolean => {
    const errors: string[] = [];

    if (!validateFileType(selectedFile)) {
      errors.push('Only CSV files are allowed');
    }

    if (!validateFileSize(selectedFile, 5)) {
      errors.push('File size must be less than 5MB');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      setValidationErrors([]);
    } else {
      setFile(null);
    }
  };

  const parseCSV = (text: string): { headers: string[], rows: string[][] } => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => sanitizeText(h.trim()));
    const rows = lines.slice(1).map(line => 
      line.split(',').map(cell => sanitizeText(cell.trim()))
    );
    
    return { headers, rows };
  };

  const handleUpload = async () => {
    if (!file || !user || profile?.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Only administrators can import attendee data",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const text = await file.text();
      const { headers, rows } = parseCSV(text);

      // Validate CSV structure
      if (!validateCSVHeaders(headers)) {
        toast({
          title: "Invalid CSV Format",
          description: "CSV contains invalid or disallowed column headers",
          variant: "destructive",
        });
        await logSecurityEvent('CSV_IMPORT_INVALID_HEADERS', 'attendees', undefined, undefined, { headers });
        return;
      }

      const validRows = [];
      const errors = [];

      // Validate each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowData: any = {};

        headers.forEach((header, index) => {
          rowData[header] = row[index] || '';
        });

        // Validate required fields
        if (!rowData.full_name || !rowData.continental_email) {
          errors.push(`Row ${i + 2}: Missing required fields (full_name, continental_email)`);
          continue;
        }

        // Validate email
        if (!validateEmail(rowData.continental_email)) {
          errors.push(`Row ${i + 2}: Invalid email format`);
          continue;
        }

        // Sanitize all text fields
        Object.keys(rowData).forEach(key => {
          if (typeof rowData[key] === 'string') {
            rowData[key] = sanitizeText(rowData[key]);
          }
        });

        validRows.push(rowData);
      }

      if (errors.length > 0) {
        toast({
          title: "Validation Errors",
          description: `Found ${errors.length} validation errors. Please fix and try again.`,
          variant: "destructive",
        });
        console.error('CSV validation errors:', errors);
        return;
      }

      // Insert valid rows
      const { error } = await supabase
        .from('attendees')
        .insert(validRows.map(row => ({
          ...row,
          checked_in: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })));

      if (error) {
        console.error('Error inserting data:', error);
        await logSecurityEvent('CSV_IMPORT_ERROR', 'attendees', undefined, undefined, { error: error.message });
        toast({
          title: "Import Failed",
          description: "Failed to import attendee data. Please try again.",
          variant: "destructive",
        });
        return;
      }

      await logSecurityEvent('CSV_IMPORT_SUCCESS', 'attendees', undefined, undefined, { rowCount: validRows.length });

      toast({
        title: "Import Successful",
        description: `Successfully imported ${validRows.length} attendees`,
      });

      setFile(null);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Error processing file:', error);
      await logSecurityEvent('CSV_IMPORT_EXCEPTION', 'attendees', undefined, undefined, { error: String(error) });
      toast({
        title: "Error",
        description: "Failed to process the file. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <Card className="w-full max-w-md mx-auto bg-continental-white border-continental-gray3">
        <CardHeader className="text-center">
          <div className="p-4 bg-continental-light-red/10 rounded-full w-fit mx-auto mb-4">
            <Shield className="h-8 w-8 text-continental-light-red" />
          </div>
          <CardTitle className="text-continental-black font-continental">Access Restricted</CardTitle>
          <CardDescription>Administrator privileges required for data import</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-continental-white border-continental-gray3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-continental-black font-continental">
          <Upload className="h-5 w-5 text-continental-yellow" />
          Secure CSV Import
        </CardTitle>
        <CardDescription>
          Import attendee data with enhanced security validation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="csvFile" className="text-continental-black font-medium">
            Select CSV File
          </Label>
          <Input
            id="csvFile"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={uploading}
            className="border-continental-gray3 focus:border-continental-yellow focus:ring-continental-yellow"
          />
          <p className="text-sm text-continental-gray1">
            Maximum file size: 5MB. Only CSV files are accepted.
          </p>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-sm">
            All data is validated and sanitized before import. Only administrators can perform imports.
          </AlertDescription>
        </Alert>

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-continental-yellow text-continental-black hover:bg-continental-yellow/90 font-medium"
        >
          {uploading ? 'Importing...' : 'Import CSV'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SecureCSVImport;
