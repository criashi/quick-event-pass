
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
    .filter(a => a.checkedIn && a.checkInTime)
    .sort((a, b) => new Date(b.checkInTime!).getTime() - new Date(a.checkInTime!).getTime())
    .slice(0, 5);

  const downloadCSV = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Department', 'Food Allergies', 'Status', 'Check-in Time'];
    const csvContent = [
      headers.join(','),
      ...attendees.map(attendee => [
        attendee.firstName,
        attendee.lastName,
        attendee.email,
        attendee.department,
        attendee.foodAllergies || 'None',
        attendee.checkedIn ? 'Checked In' : 'Pending',
        attendee.checkInTime || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `event-attendees-${new Date().toISOString().split('T')[0]}.csv`);
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
                <CardTitle className="text-2xl text-gray-800">Event Overview</CardTitle>
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
                    style={{ width: `${(stats.checkedIn / stats.total) * 100}%` }}
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
                    <p className="text-sm text-gray-600">Conference Center</p>
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
            <CardDescription>Latest attendee arrivals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentCheckIns.length > 0 ? (
                recentCheckIns.map((attendee) => (
                  <div key={attendee.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{attendee.firstName} {attendee.lastName}</p>
                      <p className="text-sm text-gray-600">{attendee.department}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Checked In
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(attendee.checkInTime!).toLocaleTimeString()}
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

      {/* Department Breakdown */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800">Department Breakdown</CardTitle>
          <CardDescription>Check-in status by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(
              attendees.reduce((acc, attendee) => {
                const dept = attendee.department;
                if (!acc[dept]) {
                  acc[dept] = { total: 0, checkedIn: 0 };
                }
                acc[dept].total++;
                if (attendee.checkedIn) {
                  acc[dept].checkedIn++;
                }
                return acc;
              }, {} as Record<string, { total: number; checkedIn: number }>)
            ).map(([department, data]) => (
              <div key={department} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">{department}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{data.checkedIn}/{data.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                      style={{ width: `${(data.checkedIn / data.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600">
                    {Math.round((data.checkedIn / data.total) * 100)}% checked in
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
