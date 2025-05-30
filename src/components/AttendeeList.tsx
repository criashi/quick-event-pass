
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, CheckCircle, Clock, Mail, AlertTriangle } from "lucide-react";
import { Attendee } from "@/types/attendee";

interface AttendeeListProps {
  attendees: Attendee[];
  onCheckIn: (attendeeId: string) => boolean;
}

const AttendeeList = ({ attendees, onCheckIn }: AttendeeListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");

  const departments = [...new Set(attendees.map(a => a.department))];

  const filteredAttendees = attendees.filter(attendee => {
    const matchesSearch = 
      attendee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === "all" ||
      (filterStatus === "checked-in" && attendee.checkedIn) ||
      (filterStatus === "pending" && !attendee.checkedIn);
    
    const matchesDepartment = 
      filterDepartment === "all" || attendee.department === filterDepartment;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-2xl text-gray-800">Attendee Management</CardTitle>
          <CardDescription>
            Search and filter event attendees, view check-in status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Attendees</SelectItem>
                <SelectItem value="checked-in">Checked In</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="md:w-48">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
            <span>Showing {filteredAttendees.length} of {attendees.length} attendees</span>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Active filters: {[
                filterStatus !== "all" && filterStatus,
                filterDepartment !== "all" && filterDepartment,
                searchTerm && "search"
              ].filter(Boolean).join(", ") || "none"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendee List */}
      <div className="grid gap-4">
        {filteredAttendees.map((attendee) => (
          <Card key={attendee.id} className="shadow-md border-0 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {attendee.firstName} {attendee.lastName}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{attendee.email}</span>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={attendee.checkedIn ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}
                    >
                      {attendee.checkedIn ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Checked In
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Pending
                        </div>
                      )}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Department:</span>
                      <p className="text-gray-600">{attendee.department}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Registration:</span>
                      <p className="text-gray-600">{new Date(attendee.registrationTime).toLocaleDateString()}</p>
                    </div>
                    {attendee.checkedIn && attendee.checkInTime && (
                      <div>
                        <span className="font-medium text-gray-700">Check-in Time:</span>
                        <p className="text-gray-600">{new Date(attendee.checkInTime).toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {attendee.foodAllergies && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-yellow-800">Food Allergies</p>
                        <p className="text-yellow-700 text-sm">{attendee.foodAllergies}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="ml-6">
                  {!attendee.checkedIn ? (
                    <Button
                      onClick={() => onCheckIn(attendee.id)}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Check In
                    </Button>
                  ) : (
                    <div className="text-center text-green-600">
                      <CheckCircle className="h-8 w-8 mx-auto mb-1" />
                      <p className="text-xs font-medium">Checked In</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredAttendees.length === 0 && (
          <Card className="shadow-md border-0">
            <CardContent className="p-12 text-center">
              <div className="text-gray-400">
                <Search className="h-16 w-16 mx-auto mb-4" />
                <p className="text-lg font-medium">No attendees found</p>
                <p className="text-sm">Try adjusting your search or filter criteria</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AttendeeList;
