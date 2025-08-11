
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QrCode, Users, CheckCircle, Clock, Loader2, User, LogOut, Menu, X, Calendar, Upload } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import Dashboard from "@/components/Dashboard";
import QRScanner from "@/components/QRScanner";
import AttendeeList from "@/components/AttendeeList";
import CSVImport from "@/components/CSVImport";
import UserProfile from "@/components/auth/UserProfile";
import QRCodeSender from "@/components/QRCodeSender";
import EventSetup from "@/components/EventSetup";
import { useSupabaseEventData } from "@/hooks/useSupabaseEventData";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const { attendees, loading, checkInAttendee, getStats, refreshData, currentEvent } = useSupabaseEventData();
  const { user, profile, signOut } = useAuth();
  const isMobile = useIsMobile();
  const stats = getStats();
  const [currentView, setCurrentView] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.title = "Aumovio Events Management";
  }, []);

  // Wrapper function to handle async check-in for QRScanner
  const handleCheckIn = async (attendeeId: string): Promise<boolean> => {
    return await checkInAttendee(attendeeId);
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: QrCode },
    { id: "scanner", label: "QR Scanner", icon: QrCode },
    { id: "attendees", label: "Attendees", icon: Users },
    { id: "qr-sender", label: "Send QR Codes", icon: QrCode },
    { id: "event-setup", label: "Event Setup", icon: Calendar },
    { id: "settings", label: "Import Attendees", icon: Upload },
    { id: "profile", label: "Profile", icon: User },
  ];

  const handleMenuItemClick = (viewId: string) => {
    setCurrentView(viewId);
    setMenuOpen(false);
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

  const renderCurrentView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard attendees={attendees} stats={stats} currentEvent={currentEvent} />;
      case "scanner":
        return <QRScanner onCheckIn={handleCheckIn} attendees={attendees} />;
      case "attendees":
        return <AttendeeList attendees={attendees} onCheckIn={checkInAttendee} eventId={currentEvent?.id} onRefresh={refreshData} />;
      case "qr-sender":
        return <QRCodeSender attendees={attendees} onRefresh={refreshData} />;
      case "event-setup":
        return <EventSetup />;
      case "settings":
        return (
          <Card className="shadow-lg border-0 bg-continental-white">
            <CardHeader>
              <CardTitle className="text-2xl text-continental-black">Import Attendees</CardTitle>
              <CardDescription className="text-continental-gray1">
                Import attendee data from CSV files for your events
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
                    <p className="text-sm text-continental-gray1">Active Event: {currentEvent?.name || 'None'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case "profile":
        return (
          <div className="flex justify-center">
            <UserProfile />
          </div>
        );
      default:
        return <Dashboard attendees={attendees} stats={stats} currentEvent={currentEvent} />;
    }
  };

  const getCurrentViewTitle = () => {
    const item = menuItems.find(item => item.id === currentView);
    return item ? item.label : "Dashboard";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-continental-gray4 via-continental-white to-continental-silver font-continental">
      <div className="container mx-auto px-4 py-8">
        {/* Top Row: Hamburger Menu (left) and User Menu (right) */}
        <div className="flex items-center justify-between mb-4">
          {/* Left: Hamburger Menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="border-continental-gray2 text-continental-gray1 hover:bg-continental-yellow hover:text-continental-black">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] bg-continental-white">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-continental-gray3">
                  <h2 className="text-lg font-semibold text-continental-black">Navigation</h2>
                </div>
                <nav className="flex-1 py-4">
                  <div className="space-y-2">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleMenuItemClick(item.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                            currentView === item.id
                              ? 'bg-continental-yellow text-continental-black font-medium'
                              : 'text-continental-gray1 hover:bg-continental-gray4 hover:text-continental-black'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          {/* Right: User Menu */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-continental-gray1 truncate max-w-[120px]`}>
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
              className="border-continental-gray2 text-continental-gray1 hover:bg-continental-yellow hover:text-continental-black"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Centered Brand Header */}
        <div className="text-center mb-8">
          <img
            src="/lovable-uploads/Aumovio_Logo_print_orange_black_CMYK.png"
            alt="Aumovio logo"
            className={`${isMobile ? 'h-8' : 'h-12'} mx-auto w-auto`}
            loading="eager"
            decoding="async"
          />
          <h1 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold text-continental-black mt-3`}>
            Events Management
          </h1>
          <div className="w-16 h-1 bg-aum-orange mx-auto mt-3"></div>
        </div>

        {/* Current View Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-continental-black">{getCurrentViewTitle()}</h2>
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

        {/* Main Content */}
        <div className="space-y-6">
          {renderCurrentView()}
        </div>
      </div>
    </div>
  );
};

export default Index;
