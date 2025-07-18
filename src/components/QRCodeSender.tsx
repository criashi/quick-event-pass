
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Mail, QrCode, Send, CheckCircle, XCircle, Loader2, Search } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [sending, setSending] = useState(false);
  const [emailResults, setEmailResults] = useState<EmailResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Filter attendees based on search term
  const filteredAttendees = attendees.filter(attendee => 
    attendee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attendee.continental_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (attendee.employee_number && attendee.employee_number.includes(searchTerm)) ||
    (attendee.business_area && attendee.business_area.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAttendees(filteredAttendees.map(a => a.id));
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

  const unsentAttendees = attendees.filter(a => !a.email_sent);
  const sentAttendees = attendees.filter(a => a.email_sent);
  
  // Get failed email recipients from the last results
  const failedEmails = emailResults.filter(r => !r.success);
  
  const sendToUnsentOnly = async () => {
    if (unsentAttendees.length === 0) {
      toast({
        title: "No Unsent QR Codes",
        description: "All attendees already have QR codes sent.",
      });
      return;
    }
    
    const unsentIds = unsentAttendees.map(a => a.id);
    
    setSending(true);
    setShowResults(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-qr-codes', {
        body: { attendeeIds: unsentIds }
      });

      if (error) {
        throw error;
      }

      setEmailResults(data.results?.details || []);
      setShowResults(true);
      
      toast({
        title: "QR Codes Sent!",
        description: `Sent to ${data.results?.emails_sent || 0} attendees who hadn't received QR codes yet.`,
      });

      if (onRefresh) {
        onRefresh();
      }

    } catch (error: any) {
      console.error('Failed to send to unsent attendees:', error);
      toast({
        title: "Error Sending QR Codes",
        description: error.message || "Failed to send QR codes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };
  
  const sendToFailedOnly = async () => {
    if (failedEmails.length === 0) {
      toast({
        title: "No Failed Emails",
        description: "There are no failed emails to retry.",
        variant: "destructive",
      });
      return;
    }
    
    // Get attendee IDs for failed emails
    const failedAttendeeIds = failedEmails.map(r => r.attendee_id);
    
    setSending(true);
    setShowResults(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-qr-codes', {
        body: { attendeeIds: failedAttendeeIds }
      });

      if (error) {
        throw error;
      }

      setEmailResults(data.results?.details || []);
      setShowResults(true);
      
      toast({
        title: "Retry Complete!",
        description: `Retried ${failedEmails.length} failed emails. ${data.results?.emails_sent || 0} successful.`,
      });

      if (onRefresh) {
        onRefresh();
      }

    } catch (error: any) {
      console.error('Failed to retry emails:', error);
      toast({
        title: "Retry Failed",
        description: error.message || "Failed to retry emails. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4 p-2 max-w-full">
      {/* Send QR Codes Card */}
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg md:text-xl text-gray-800 flex items-center gap-2">
            <QrCode className="h-5 w-5 text-blue-600" />
            Send QR Codes
          </CardTitle>
          <CardDescription className="text-sm">
            Generate and send personalized QR codes to registered attendees via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={() => sendQRCodes(true)}
              disabled={sending || attendees.length === 0}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 flex-1"
            >
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Mail className="mr-2 h-4 w-4" />
              <span className="text-sm">Send to All ({attendees.length})</span>
            </Button>
            
            {unsentAttendees.length > 0 && (
              <Button 
                onClick={sendToUnsentOnly}
                disabled={sending}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 flex-1"
              >
                {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Mail className="mr-2 h-4 w-4" />
                <span className="text-sm">Send to Unsent ({unsentAttendees.length})</span>
              </Button>
            )}
            
            <Button 
              onClick={() => sendQRCodes(false)}
              disabled={sending || selectedAttendees.length === 0}
              variant="outline"
              className="flex-1"
            >
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              <span className="text-sm">Send Selected ({selectedAttendees.length})</span>
            </Button>
            
            {failedEmails.length > 0 && (
              <Button 
                onClick={sendToFailedOnly}
                disabled={sending}
                variant="destructive"
                className="flex-1"
              >
                {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <XCircle className="mr-2 h-4 w-4" />
                <span className="text-sm">Retry Failed ({failedEmails.length})</span>
              </Button>
            )}
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs font-medium text-blue-600">Total</p>
              <p className="text-lg font-bold text-blue-800">{attendees.length}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs font-medium text-green-600">Sent</p>
              <p className="text-lg font-bold text-green-800">{sentAttendees.length}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <p className="text-xs font-medium text-orange-600">Pending</p>
              <p className="text-lg font-bold text-orange-800">{unsentAttendees.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendee Selection */}
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-800">Select Attendees</CardTitle>
          <CardDescription className="text-sm">Search and choose specific attendees to send QR codes to</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, employee number, or business area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Select All */}
            <div className="flex items-center space-x-2 pb-3 border-b">
              <Checkbox
                id="select-all"
                checked={selectedAttendees.length === filteredAttendees.length && filteredAttendees.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Select All Filtered ({filteredAttendees.length})
              </label>
            </div>

            {/* Attendee List */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredAttendees.map((attendee) => (
                <div key={attendee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <Checkbox
                      id={attendee.id}
                      checked={selectedAttendees.includes(attendee.id)}
                      onCheckedChange={(checked) => handleSelectAttendee(attendee.id, checked as boolean)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm truncate">{attendee.full_name}</p>
                      <p className="text-xs text-gray-600 truncate">{attendee.continental_email}</p>
                      {attendee.business_area && (
                        <p className="text-xs text-gray-500 truncate">{attendee.business_area}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {attendee.email_sent ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Sent
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredAttendees.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No attendees found matching your search</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Results */}
      {showResults && emailResults.length > 0 && (
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-gray-800">Email Results</CardTitle>
            <CardDescription className="text-sm">Status of QR code emails sent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {emailResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm truncate">{result.email}</p>
                    {result.error && (
                      <p className="text-xs text-red-600 truncate">{result.error}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {result.success ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Sent
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
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
