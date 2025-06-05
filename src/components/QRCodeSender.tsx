
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, QrCode, Send, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Attendee } from "@/types/attendee";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface QRCodeSenderProps {
  attendees: Attendee[];
  onRefresh?: () => void;
}

interface EmailResult {
  attendee_id: string;
  email: string;
  success: boolean;
  error?: string;
}

const QRCodeSender = ({ attendees, onRefresh }: QRCodeSenderProps) => {
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [emailResults, setEmailResults] = useState<EmailResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAttendees(attendees.map(a => a.id));
    } else {
      setSelectedAttendees([]);
    }
  };

  const handleSelectAttendee = (attendeeId: string, checked: boolean) => {
    if (checked) {
      setSelectedAttendees(prev => [...prev, attendeeId]);
    } else {
      setSelectedAttendees(prev => prev.filter(id => id !== attendeeId));
    }
  };

  const sendQRCodes = async (sendToAll: boolean = false) => {
    setSending(true);
    setShowResults(false);
    
    try {
      const payload = sendToAll 
        ? { sendToAll: true }
        : { attendeeIds: selectedAttendees };

      console.log('Sending QR codes with payload:', payload);

      const { data, error } = await supabase.functions.invoke('send-qr-codes', {
        body: payload
      });

      if (error) {
        console.error('Error invoking send-qr-codes function:', error);
        throw error;
      }

      console.log('QR codes sent successfully:', data);
      
      setEmailResults(data.results?.details || []);
      setShowResults(true);
      
      toast({
        title: "QR Codes Sent!",
        description: `Sent to ${data.results?.emails_sent || 0} attendees. ${data.results?.emails_failed || 0} failed.`,
      });

      if (onRefresh) {
        onRefresh();
      }

    } catch (error: any) {
      console.error('Failed to send QR codes:', error);
      toast({
        title: "Error Sending QR Codes",
        description: error.message || "Failed to send QR codes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const unsentAttendees = attendees.filter(a => !a.qr_code_data);
  const sentAttendees = attendees.filter(a => a.qr_code_data);

  return (
    <div className="space-y-6">
      {/* Send QR Codes Card */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-2xl text-gray-800 flex items-center gap-2">
            <QrCode className="h-6 w-6 text-blue-600" />
            Send QR Codes
          </CardTitle>
          <CardDescription>
            Generate and send personalized QR codes to registered attendees via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={() => sendQRCodes(true)}
              disabled={sending || attendees.length === 0}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Mail className="mr-2 h-4 w-4" />
              Send to All ({attendees.length})
            </Button>
            
            <Button 
              onClick={() => sendQRCodes(false)}
              disabled={sending || selectedAttendees.length === 0}
              variant="outline"
            >
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Send to Selected ({selectedAttendees.length})
            </Button>
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-600">Total Attendees</p>
              <p className="text-2xl font-bold text-blue-800">{attendees.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-600">QR Codes Sent</p>
              <p className="text-2xl font-bold text-green-800">{sentAttendees.length}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-orange-600">Pending</p>
              <p className="text-2xl font-bold text-orange-800">{unsentAttendees.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendee Selection */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800">Select Attendees</CardTitle>
          <CardDescription>Choose specific attendees to send QR codes to</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Select All */}
            <div className="flex items-center space-x-2 pb-4 border-b">
              <Checkbox
                id="select-all"
                checked={selectedAttendees.length === attendees.length}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Select All Attendees ({attendees.length})
              </label>
            </div>

            {/* Attendee List */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {attendees.map((attendee) => (
                <div key={attendee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={attendee.id}
                      checked={selectedAttendees.includes(attendee.id)}
                      onCheckedChange={(checked) => handleSelectAttendee(attendee.id, checked as boolean)}
                    />
                    <div>
                      <p className="font-medium text-gray-900">{attendee.full_name}</p>
                      <p className="text-sm text-gray-600">{attendee.continental_email}</p>
                      <p className="text-xs text-gray-500">{attendee.business_area}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {attendee.qr_code_data ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        QR Sent
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Results */}
      {showResults && emailResults.length > 0 && (
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800">Email Results</CardTitle>
            <CardDescription>Status of QR code emails sent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {emailResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{result.email}</p>
                    {result.error && (
                      <p className="text-sm text-red-600">{result.error}</p>
                    )}
                  </div>
                  <div>
                    {result.success ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Sent
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QRCodeSender;
