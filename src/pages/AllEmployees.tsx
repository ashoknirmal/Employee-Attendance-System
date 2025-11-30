import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ArrowLeft, Search } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface AttendanceWithProfile {
  id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: "present" | "absent" | "late" | "half-day";
  total_hours: number;
  profiles: {
    id: string;
    name: string;
    employee_id: string;
    department: string;
  };
}

const AllEmployees = () => {
  const { profile } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceWithProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.role === "manager") {
      fetchAttendance();
    } else {
      navigate("/");
    }
  }, [profile, selectedDate]);

  const fetchAttendance = async () => {
    const { data } = await supabase
      .from("attendance")
      .select(`
        *,
        profiles (*)
      `)
      .eq("date", selectedDate)
      .order("check_in_time", { ascending: false });

    if (data) setAttendance(data);
  };

  const filteredAttendance = attendance.filter((record) => {
    const matchesSearch =
      record.profiles.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.profiles.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.profiles.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "text-present";
      case "absent":
        return "text-absent";
      case "late":
        return "text-late";
      case "half-day":
        return "text-half-day";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-present/10 border-present";
      case "absent":
        return "bg-absent/10 border-absent";
      case "late":
        return "bg-late/10 border-late";
      case "half-day":
        return "bg-half-day/10 border-half-day";
      default:
        return "bg-muted";
    }
  };

  if (profile?.role !== "manager") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/manager")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">All Employees Attendance</h1>
              <p className="text-sm text-muted-foreground">{format(new Date(selectedDate), "MMMM dd, yyyy")}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="half-day">Half Day</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Attendance List */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records ({filteredAttendance.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredAttendance.length > 0 ? (
                filteredAttendance.map((record) => (
                  <div
                    key={record.id}
                    className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${getStatusBgColor(record.status)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-semibold text-lg">{record.profiles.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {record.profiles.employee_id} • {record.profiles.department}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Check In</p>
                          <p className="font-medium">
                            {record.check_in_time
                              ? format(new Date(record.check_in_time), "hh:mm a")
                              : "-"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Check Out</p>
                          <p className="font-medium">
                            {record.check_out_time
                              ? format(new Date(record.check_out_time), "hh:mm a")
                              : "-"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Hours</p>
                          <p className="font-medium">{record.total_hours}h</p>
                        </div>
                        <div className={`px-4 py-2 rounded-full font-semibold ${getStatusColor(record.status)}`}>
                          {record.status.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No attendance records found
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AllEmployees;
