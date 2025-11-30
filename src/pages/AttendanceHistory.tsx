import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { useNavigate } from "react-router-dom";

interface AttendanceRecord {
  id: string;
  date: string;
  status: "present" | "absent" | "late" | "half-day";
  check_in_time: string | null;
  check_out_time: string | null;
  total_hours: number;
}

const AttendanceHistory = () => {
  const { profile } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      fetchAttendance();
    }
  }, [profile, currentMonth]);

  const fetchAttendance = async () => {
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");

    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", profile?.id)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: true });

    if (data) setAttendance(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-present text-white";
      case "absent":
        return "bg-absent text-white";
      case "late":
        return "bg-late text-white";
      case "half-day":
        return "bg-half-day text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getAttendanceForDate = (date: Date) => {
    return attendance.find((record) => isSameDay(new Date(record.date), date));
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const selectedRecord = selectedDate ? getAttendanceForDate(selectedDate) : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Attendance History</h1>
              <p className="text-sm text-muted-foreground">{format(currentMonth, "MMMM yyyy")}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
            >
              Next
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Calendar View</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                      {day}
                    </div>
                  ))}
                  {days.map((day) => {
                    const record = getAttendanceForDate(day);
                    const isToday = isSameDay(day, new Date());
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`
                          aspect-square p-2 rounded-lg border text-sm font-medium
                          transition-all hover:scale-105
                          ${isToday ? "ring-2 ring-primary" : ""}
                          ${isSelected ? "ring-2 ring-accent" : ""}
                          ${record ? getStatusColor(record.status) : "bg-card hover:bg-accent/10"}
                        `}
                      >
                        {format(day, "d")}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-present"></div>
                    <span className="text-sm">Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-absent"></div>
                    <span className="text-sm">Absent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-late"></div>
                    <span className="text-sm">Late</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-half-day"></div>
                    <span className="text-sm">Half Day</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDate ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="text-lg font-semibold">{format(selectedDate, "MMMM dd, yyyy")}</p>
                    </div>
                    {selectedRecord ? (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <p className={`text-lg font-semibold capitalize ${getStatusColor(selectedRecord.status).replace("bg-", "text-")}`}>
                            {selectedRecord.status}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Check In</p>
                          <p className="text-lg font-semibold">
                            {selectedRecord.check_in_time
                              ? format(new Date(selectedRecord.check_in_time), "hh:mm a")
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Check Out</p>
                          <p className="text-lg font-semibold">
                            {selectedRecord.check_out_time
                              ? format(new Date(selectedRecord.check_out_time), "hh:mm a")
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Hours</p>
                          <p className="text-lg font-semibold">{selectedRecord.total_hours} hours</p>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No attendance record for this date</p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Select a date to view details</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AttendanceHistory;
