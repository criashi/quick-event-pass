
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Calendar, MapPin, Clock } from "lucide-react";
import { Attendee } from "@/types/attendee";
import { Event } from "@/types/event";

interface DashboardProps {
  attendees: Attendee[];
  stats: {
    total: number;
    checkedIn: number;
    pending: number;
  };
  currentEvent: Event | null;
}

const Dashboard = ({ attendees, stats, currentEvent }: DashboardProps) => {
  const recentCheckIns = attendees
    .filter(a => a.checked_in && a.check_in_time)
    .sort((a, b) => new Date(b.check_in_time!).getTime() - new Date(a.check_in_time!).getTime())
    .slice(0, 5);

  const downloadCSV = () => {
    const eventName = currentEvent?.name || 'continental-event';
    const headers = ['Full Name', 'Continental Email', 'Employee Number', 'Business Area', 'Vegetarian/Vegan Option', 'Status', 'Check-in Time'];
    const csvContent = [
      headers.join(','),
      ...attendees.map(attendee => [
        `"${attendee.full_name}"`,
        attendee.continental_email,
        attendee.employee_number || 'N/A',
        `"${attendee.business_area || 'N/A'}"`,
        attendee.vegetarian_vegan_option || 'No',
        attendee.checked_in ? 'Checked In' : 'Pending',
        attendee.check_in_time ? new Date(attendee.check_in_time).toLocaleString() : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${eventName.toLowerCase().replace(/\s+/g, '-')}-attendees-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Current Event Header */}
      {currentEvent && (
        <Card className="bg-gradient-to-r from-continental-dark-blue to-continental-light-blue text-white border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{currentEvent.name}</CardTitle>
                <Badge variant="secondary" className="bg-continental-yellow text-continental-black mt-2">
                  Active Event
                </Badge>
              </div>
              <Calendar className="h-8 w-8" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(currentEvent.event_date + 'T00:00:00').toLocaleDateString()}</span>
              </div>
              {currentEvent.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{currentEvent.location}</span>
                </div>
              )}
              {currentEvent.start_time && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{currentEvent.start_time} - {currentEvent.end_time || 'End TBD'}</span>
                </div>
              )}
            </div>
            {currentEvent.description && (
              <p className="mt-3 text-continental-white/90">{currentEvent.description}</p>
            )}
          </CardContent>
        </Card>
      )}

      {!currentEvent && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-800 font-medium">No Active Event</p>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              Please set up and activate an event in Event Setup to start managing attendees.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Overview */}
        <Card className="lg:col-span-2 shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-gray-800">
                  {currentEvent ? `${currentEvent.name} Overview` : 'Event Overview'}
                </CardTitle>
                <CardDescription>Real-time check-in statistics and progress</CardDescription>
              </div>
              <Button 
                onClick={downloadCSV} 
                disabled={!currentEvent}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Check-in Progress</span>
                  <span className="text-gray-600">{stats.checkedIn} of {stats.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${stats.total > 0 ? (stats.checkedIn / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Check-ins */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Recent Check-ins
            </CardTitle>
            <CardDescription>Latest employee arrivals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentCheckIns.length > 0 ? (
                recentCheckIns.map((attendee) => (
                  <div key={attendee.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{attendee.full_name}</p>
                      <p className="text-sm text-gray-600">{attendee.business_area || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Checked In
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(attendee.check_in_time!).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No recent check-ins</p>
                  <p className="text-sm">
                    {currentEvent ? 'Start scanning QR codes to see activity' : 'Set up an active event first'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Area Breakdown */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800">Business Area Breakdown</CardTitle>
          <CardDescription>Check-in status by business area</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.total > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(
                attendees.reduce((acc, attendee) => {
                  const area = attendee.business_area || 'Unknown';
                  if (!acc[area]) {
                    acc[area] = { total: 0, checkedIn: 0 };
                  }
                  acc[area].total++;
                  if (attendee.checked_in) {
                    acc[area].checkedIn++;
                  }
                  return acc;
                }, {} as Record<string, { total: number; checkedIn: number }>)
              ).map(([area, data]) => (
                <div key={area} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2 text-sm">{area}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{data.checkedIn}/{data.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                        style={{ width: `${data.total > 0 ? (data.checkedIn / data.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600">
                      {data.total > 0 ? Math.round((data.checkedIn / data.total) * 100) : 0}% checked in
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No attendees registered yet</p>
              <p className="text-sm">
                {currentEvent ? 'Import attendees to see business area breakdown' : 'Set up an active event and import attendees'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
