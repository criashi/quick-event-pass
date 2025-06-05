
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Calendar, MapPin } from "lucide-react";
import { Attendee } from "@/types/attendee";

interface DashboardProps {
  attendees: Attendee[];
  stats: {
    total: number;
    checkedIn: number;
    pending: number;
  };
}

const Dashboard = ({ attendees, stats }: DashboardProps) => {
  const recentCheckIns = attendees
    .filter(a => a.checked_in && a.check_in_time)
    .sort((a, b) => new Date(b.check_in_time!).getTime() - new Date(a.check_in_time!).getTime())
    .slice(0, 5);

  const downloadCSV = () => {
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
    a.setAttribute('download', `continental-event-attendees-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Overview */}
        <Card className="lg:col-span-2 shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-gray-800">Continental Event Overview</CardTitle>
                <CardDescription>Real-time check-in statistics and progress</CardDescription>
              </div>
              <Button onClick={downloadCSV} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
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

              {/* Event Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-800">Event Date</p>
                    <p className="text-sm text-gray-600">Today, {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-800">Location</p>
                    <p className="text-sm text-gray-600">Continental Headquarters</p>
                  </div>
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
                      <p className="text-sm text-gray-600">{attendee.business_area}</p>
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
                  <p className="text-sm">Start scanning QR codes to see activity</p>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
