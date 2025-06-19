
import React, { useState } from "react";
import Dashboard from "@/components/Dashboard";
import AttendeeList from "@/components/AttendeeList";
import QRScanner from "@/components/QRScanner";
import QRCodeSender from "@/components/QRCodeSender";
import CSVImport from "@/components/CSVImport";
import EventSetup from "@/components/EventSetup";
import { useSupabaseEventData } from "@/hooks/useSupabaseEventData";
import { useEventManagement } from "@/hooks/useEventManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, QrCode, Settings, Upload, Mail } from "lucide-react";

const Index = () => {
  const { currentEvent, loading: eventLoading } = useEventManagement();
  const { attendees, loading: attendeesLoading, checkInAttendee, getStats, refreshData } = useSupabaseEventData(currentEvent?.id);
  const [activeTab, setActiveTab] = useState("dashboard");

  console.log('Current event:', currentEvent);
  console.log('Attendees count:', attendees.length);

  const loading = eventLoading || attendeesLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Settings className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading event data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Event Header */}
        {currentEvent && (
          <Card className="mb-6 bg-gradient-to-r from-continental-light-green to-continental-dark-green text-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{currentEvent.name}</CardTitle>
                  <CardDescription className="text-continental-white/90">
                    {new Date(currentEvent.event_date).toLocaleDateString()} • {currentEvent.location}
                  </CardDescription>
                </div>
                <Calendar className="h-8 w-8" />
              </div>
            </CardHeader>
          </Card>
        )}

        {!currentEvent && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800">No Active Event</CardTitle>
              <CardDescription className="text-orange-600">
                Please set up an event in the Event Setup tab to get started.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="attendees" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Attendees
            </TabsTrigger>
            <TabsTrigger value="checkin" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Check-in
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
            </TabsTrigger>
            <TabsTrigger value="qr-codes" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Send QR
            </TabsTrigger>
            <TabsTrigger value="setup" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Event Setup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard attendees={attendees} stats={getStats()} />
          </TabsContent>

          <TabsContent value="attendees">
            <AttendeeList attendees={attendees} onCheckIn={checkInAttendee} />
          </TabsContent>

          <TabsContent value="checkin">
            <QRScanner attendees={attendees} onCheckIn={checkInAttendee} />
          </TabsContent>

          <TabsContent value="import">
            <CSVImport onImportComplete={refreshData} currentEvent={currentEvent} />
          </TabsContent>

          <TabsContent value="qr-codes">
            <QRCodeSender attendees={attendees} />
          </TabsContent>

          <TabsContent value="setup">
            <EventSetup />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
