
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QrCode, Users, CheckCircle, Clock, Loader2, User, LogOut, Menu } from "lucide-react";
import Dashboard from "@/components/Dashboard";
import QRScanner from "@/components/QRScanner";
import AttendeeList from "@/components/AttendeeList";
import CSVImport from "@/components/CSVImport";
import UserProfile from "@/components/auth/UserProfile";
import QRCodeSender from "@/components/QRCodeSender";
import { useSupabaseEventData } from "@/hooks/useSupabaseEventData";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const { attendees, loading, checkInAttendee, getStats, refreshData } = useSupabaseEventData();
  const { user, profile, signOut } = useAuth();
  const isMobile = useIsMobile();
  const stats = getStats();

  // Wrapper function to handle async check-in for QRScanner
  const handleCheckIn = async (attendeeId: string): Promise<boolean> => {
    return await checkInAttendee(attendeeId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-continental-gray4 via-continental-white to-continental-silver flex items-center justify-center font-continental">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-continental-yellow mx-auto mb-4" />
          <p className="text-lg text-continental-gray1 font-medium">Loading event data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-continental-gray4 via-continental-white to-continental-silver font-continental">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Continental Branding */}
        <div className="flex justify-between items-start mb-8">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-continental-yellow to-continental-yellow/80 rounded-xl shadow-lg border-2 border-continental-black/10">
                <img 
                  src="/lovable-uploads/7db59a9c-fbb6-4e19-951e-7a41b8ae2800.png" 
                  alt="Continental Logo" 
                  className="h-8 w-8 object-contain"
                />
              </div>
              <h1 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold text-continental-black`}>
                Continental Events
              </h1>
            </div>
            <div className="w-20 h-1 bg-continental-yellow mx-auto mb-4"></div>
            <p className={`${isMobile ? 'text-base' : 'text-lg'} text-continental-gray1 font-medium max-w-2xl mx-auto`}>
              Employee event registration and check-in management system
            </p>
          </div>
          
          {/* User Menu */}
          <div className="flex items-center gap-2 ml-4">
            <div className="text-right">
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-continental-gray1`}>
                {profile?.full_name || user?.email}
              </p>
              <Badge variant={profile?.role === 'admin' ? 'default' : 'secondary'} className="text-xs bg-continental-yellow text-continental-black">
                {profile?.role}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={signOut}
              className="ml-2 border-continental-gray2 text-continental-gray1 hover:bg-continental-yellow hover:text-continental-black"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats Overview with Continental Colors */}
        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-4'} gap-4 md:gap-6 mb-8`}>
          <Card className="bg-gradient-to-r from-continental-dark-blue to-continental-light-blue text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-continental-white/80 ${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>Total Registered</p>
                  <p className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold`}>{stats.total}</p>
                </div>
                <Users className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-continental-white/70`} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-continental-dark-green to-continental-light-green text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-continental-white/80 ${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>Checked In</p>
                  <p className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold`}>{stats.checkedIn}</p>
                </div>
                <CheckCircle className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-continental-white/70`} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-continental-yellow to-continental-yellow/80 text-continental-black border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-continental-black/70 ${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>Pending</p>
                  <p className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold`}>{stats.pending}</p>
                </div>
                <Clock className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-continental-black/60`} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-continental-gray1 to-continental-gray2 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-continental-white/80 ${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>Check-in Rate</p>
                  <p className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold`}>{stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0}%</p>
                </div>
                <QrCode className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-continental-white/70`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content with Continental Styling */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className={`${isMobile ? 'grid grid-cols-3 gap-1 h-auto p-1' : 'grid w-full grid-cols-6'} bg-continental-white shadow-md border border-continental-gray3`}>
            <TabsTrigger 
              value="dashboard" 
              className={`${isMobile ? 'flex flex-col items-center gap-1 px-2 py-2 text-xs' : ''} data-[state=active]:bg-continental-yellow data-[state=active]:text-continental-black text-continental-gray1 font-medium`}
            >
              {isMobile && <QrCode className="h-4 w-4" />}
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="scanner" 
              className={`${isMobile ? 'flex flex-col items-center gap-1 px-2 py-2 text-xs' : ''} data-[state=active]:bg-continental-yellow data-[state=active]:text-continental-black text-continental-gray1 font-medium`}
            >
              {isMobile && <QrCode className="h-4 w-4" />}
              QR Scanner
            </TabsTrigger>
            <TabsTrigger 
              value="attendees" 
              className={`${isMobile ? 'flex flex-col items-center gap-1 px-2 py-2 text-xs' : ''} data-[state=active]:bg-continental-yellow data-[state=active]:text-continental-black text-continental-gray1 font-medium`}
            >
              {isMobile && <Users className="h-4 w-4" />}
              Attendees
            </TabsTrigger>
            {!isMobile && (
              <>
                <TabsTrigger value="qr-sender" className="data-[state=active]:bg-continental-yellow data-[state=active]:text-continental-black text-continental-gray1 font-medium">
                  Send QR Codes
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-continental-yellow data-[state=active]:text-continental-black text-continental-gray1 font-medium">
                  Settings
                </TabsTrigger>
                <TabsTrigger value="profile" className="data-[state=active]:bg-continental-yellow data-[state=active]:text-continental-black text-continental-gray1 font-medium">
                  <User className="h-4 w-4 mr-1" />
                  Profile
                </TabsTrigger>
              </>
            )}
            {isMobile && (
              <TabsTrigger 
                value="more" 
                className="flex flex-col items-center gap-1 px-2 py-2 text-xs data-[state=active]:bg-continental-yellow data-[state=active]:text-continental-black text-continental-gray1 font-medium"
              >
                <Menu className="h-4 w-4" />
                More
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard attendees={attendees} stats={stats} />
          </TabsContent>

          <TabsContent value="scanner">
            <QRScanner onCheckIn={handleCheckIn} attendees={attendees} />
          </TabsContent>

          <TabsContent value="attendees">
            <AttendeeList attendees={attendees} onCheckIn={checkInAttendee} />
          </TabsContent>

          {!isMobile && (
            <>
              <TabsContent value="qr-sender">
                <QRCodeSender attendees={attendees} onRefresh={refreshData} />
              </TabsContent>

              <TabsContent value="settings">
                <Card className="shadow-lg border-0 bg-continental-white">
                  <CardHeader>
                    <CardTitle className="text-2xl text-continental-black">System Settings</CardTitle>
                    <CardDescription className="text-continental-gray1">
                      Configure your event check-in system and import attendee data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <CSVImport onImportComplete={refreshData} />
                    
                    <div className="border-t border-continental-gray3 pt-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-continental-black">Database Status</h3>
                        <div className="space-y-2">
                          <p className="text-sm text-continental-gray1">Status: <Badge variant="secondary" className="bg-continental-light-green text-continental-white">Connected</Badge></p>
                          <p className="text-sm text-continental-gray1">Provider: Supabase</p>
                          <p className="text-sm text-continental-gray1">Total Records: {stats.total}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="profile">
                <div className="flex justify-center">
                  <UserProfile />
                </div>
              </TabsContent>
            </>
          )}

          {isMobile && (
            <TabsContent value="more">
              <div className="space-y-4">
                <Card className="shadow-lg border-0 bg-continental-white">
                  <CardHeader>
                    <CardTitle className="text-xl text-continental-black">Additional Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Tabs defaultValue="qr-sender" className="space-y-4">
                      <TabsList className="grid w-full grid-cols-3 bg-continental-gray4">
                        <TabsTrigger value="qr-sender" className="text-xs">QR Codes</TabsTrigger>
                        <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
                        <TabsTrigger value="profile" className="text-xs">Profile</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="qr-sender">
                        <QRCodeSender attendees={attendees} onRefresh={refreshData} />
                      </TabsContent>
                      
                      <TabsContent value="settings">
                        <CSVImport onImportComplete={refreshData} />
                      </TabsContent>
                      
                      <TabsContent value="profile">
                        <UserProfile />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
