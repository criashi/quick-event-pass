
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, CheckCircle, Clock, Mail, AlertTriangle, Building, XCircle } from "lucide-react";
import { Attendee } from "@/types/attendee";
import AddAttendeeDialog from "@/components/AddAttendeeDialog";

interface AttendeeListProps {
  attendees: Attendee[];
  onCheckIn: (attendeeId: string) => Promise<boolean>;
  onUncheckIn: (attendeeId: string) => Promise<boolean>;
  eventId?: string;
  onRefresh: () => void;
}

const AttendeeList = ({ attendees, onCheckIn, onUncheckIn, eventId, onRefresh }: AttendeeListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterBusinessArea, setFilterBusinessArea] = useState("all");

  const businessAreas = [...new Set(attendees.map(a => a.business_area).filter(Boolean))];

  const filteredAttendees = attendees.filter(attendee => {
    const matchesSearch = 
      attendee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.continental_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (attendee.employee_number && attendee.employee_number.includes(searchTerm)) ||
      (attendee.business_area && attendee.business_area.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = 
      filterStatus === "all" ||
      (filterStatus === "checked-in" && attendee.checked_in) ||
      (filterStatus === "pending" && !attendee.checked_in);
    
    const matchesBusinessArea = 
      filterBusinessArea === "all" || attendee.business_area === filterBusinessArea;

    return matchesSearch && matchesStatus && matchesBusinessArea;
  });

  return (
    <div className="space-y-4 p-4 max-w-full overflow-hidden">
      {/* Filters */}
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg md:text-xl text-gray-800">Aumovio Employee Management</CardTitle>
              <CardDescription className="text-sm">
                Search and filter event attendees, view check-in status
              </CardDescription>
            </div>
            <div className="flex-shrink-0">
              <AddAttendeeDialog eventId={eventId} onAttendeeAdded={onRefresh} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-full">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or employee number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <div className="flex flex-col gap-2 mt-3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Attendees</SelectItem>
                  <SelectItem value="checked-in">Checked In</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterBusinessArea} onValueChange={setFilterBusinessArea}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by business area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Business Areas</SelectItem>
                  {businessAreas.map(area => (
                    <SelectItem key={area} value={area!}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div>Showing {filteredAttendees.length} of {attendees.length} employees</div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs">Active filters: {[
                filterStatus !== "all" && filterStatus,
                filterBusinessArea !== "all" && filterBusinessArea,
                searchTerm && "search"
              ].filter(Boolean).join(", ") || "none"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendee List */}
      <div className="space-y-3">
        {filteredAttendees.map((attendee) => (
          <Card key={attendee.id} className="shadow-md border-0 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-gray-800 truncate">
                        {attendee.full_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate text-xs">{attendee.continental_email}</span>
                      </div>
                      {attendee.employee_number && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Building className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate text-xs">Employee #: {attendee.employee_number}</span>
                        </div>
                      )}
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`flex-shrink-0 text-xs ${attendee.checked_in ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}
                    >
                      {attendee.checked_in ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Checked In</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Pending</span>
                        </div>
                      )}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Business Area:</span>
                      <p className="text-gray-600 text-xs">{attendee.business_area || 'Not specified'}</p>
                    </div>
                    {attendee.checked_in && attendee.check_in_time && (
                      <div>
                        <span className="font-medium text-gray-700">Check-in Time:</span>
                        <p className="text-gray-600 text-xs">{new Date(attendee.check_in_time).toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {attendee.vegetarian_vegan_option === 'Yes' && (
                    <div className="p-3 bg-green-50 rounded-lg flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-green-800 text-sm">Dietary Requirements</p>
                        <p className="text-green-700 text-xs">Vegetarian/Vegan option required</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-center">
                  {!attendee.checked_in ? (
                    <Button
                      onClick={() => onCheckIn(attendee.id)}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Check In
                    </Button>
                  ) : (
                    <Button
                      onClick={() => onUncheckIn(attendee.id)}
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Uncheck-in
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredAttendees.length === 0 && (
          <Card className="shadow-md border-0">
            <CardContent className="p-8 text-center">
              <div className="text-gray-400">
                <Search className="h-12 w-12 mx-auto mb-3" />
                <p className="text-base font-medium">No employees found</p>
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
