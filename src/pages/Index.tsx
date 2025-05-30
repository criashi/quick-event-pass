
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QrCode, Users, CheckCircle, Clock, Download, Search } from "lucide-react";
import Dashboard from "@/components/Dashboard";
import QRScanner from "@/components/QRScanner";
import AttendeeList from "@/components/AttendeeList";
import { useEventData } from "@/hooks/useEventData";

const Index = () => {
  const { attendees, checkInAttendee, getStats } = useEventData();
  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <QrCode className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Event Check-In System
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Streamlined QR code-based attendee management integrated with Microsoft Forms
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Registered</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Checked In</p>
                  <p className="text-3xl font-bold">{stats.checkedIn}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Pending</p>
                  <p className="text-3xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Check-in Rate</p>
                  <p className="text-3xl font-bold">{Math.round((stats.checkedIn / stats.total) * 100)}%</p>
                </div>
                <QrCode className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-md border border-gray-200">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="scanner" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              QR Scanner
            </TabsTrigger>
            <TabsTrigger value="attendees" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Attendees
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard attendees={attendees} stats={stats} />
          </TabsContent>

          <TabsContent value="scanner">
            <QRScanner onCheckIn={checkInAttendee} attendees={attendees} />
          </TabsContent>

          <TabsContent value="attendees">
            <AttendeeList attendees={attendees} onCheckIn={checkInAttendee} />
          </TabsContent>

          <TabsContent value="settings">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-800">System Settings</CardTitle>
                <CardDescription>
                  Configure your event check-in system and Microsoft integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Microsoft Forms Integration</h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Form ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">form-123-456</span></p>
                      <p className="text-sm text-gray-600">Last Sync: <span className="text-green-600">2 minutes ago</span></p>
                      <Button variant="outline" size="sm">Sync Now</Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Email Settings</h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Status: <Badge variant="secondary" className="bg-green-100 text-green-800">Connected</Badge></p>
                      <p className="text-sm text-gray-600">Provider: Microsoft Graph API</p>
                      <Button variant="outline" size="sm">Test Email</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
