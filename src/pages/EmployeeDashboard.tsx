import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, LogOut } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface AttendanceRecord {
  id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: "present" | "absent" | "late" | "half-day";
  total_hours: number;
}

interface Stats {
  present: number;
  absent: number;
  late: number;
  totalHours: number;
}

const EmployeeDashboard = () => {
  const { profile, signOut } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [stats, setStats] = useState<Stats>({ present: 0, absent: 0, late: 0, totalHours: 0 });
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      fetchTodayAttendance();
      fetchMonthlyStats();
      fetchRecentAttendance();
    }
  }, [profile]);

  const fetchTodayAttendance = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", profile?.id)
      .eq("date", today)
      .maybeSingle();

    setTodayAttendance(data);
  };

  const fetchMonthlyStats = async () => {
    const start = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const end = format(endOfMonth(new Date()), "yyyy-MM-dd");

    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", profile?.id)
      .gte("date", start)
      .lte("date", end);

    if (data) {
      const present = data.filter((r) => r.status === "present").length;
      const absent = data.filter((r) => r.status === "absent").length;
      const late = data.filter((r) => r.status === "late").length;
      const totalHours = data.reduce((sum, r) => sum + (r.total_hours || 0), 0);

      setStats({ present, absent, late, totalHours });
    }
  };

  const fetchRecentAttendance = async () => {
    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", profile?.id)
      .order("date", { ascending: false })
      .limit(7);

    if (data) setRecentAttendance(data);
  };

  const handleCheckIn = async () => {
    setLoading(true);
    const today = format(new Date(), "yyyy-MM-dd");
    const now = new Date().toISOString();

    try {
      const { error } = await supabase.from("attendance").insert({
        user_id: profile?.id,
        date: today,
        check_in_time: now,
        status: "present",
      });

      if (error) throw error;

      toast.success("Checked in successfully!");
      fetchTodayAttendance();
      fetchMonthlyStats();
      fetchRecentAttendance();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!todayAttendance) return;

    setLoading(true);
    const now = new Date().toISOString();
    const checkInTime = new Date(todayAttendance.check_in_time!);
    const checkOutTime = new Date(now);
    const hours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

    try {
      const { error } = await supabase
        .from("attendance")
        .update({
          check_out_time: now,
          total_hours: Math.round(hours * 100) / 100,
        })
        .eq("id", todayAttendance.id);

      if (error) throw error;

      toast.success("Checked out successfully!");
      fetchTodayAttendance();
      fetchMonthlyStats();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-4 w-4" />;
      case "absent":
        return <XCircle className="h-4 w-4" />;
      case "late":
        return <AlertCircle className="h-4 w-4" />;
      case "half-day":
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Employee Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {profile?.name} • {profile?.employee_id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/attendance-history")}>
              View History
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Today's Status */}
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayAttendance ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className={`flex items-center gap-2 ${getStatusColor(todayAttendance.status)}`}>
                      {getStatusIcon(todayAttendance.status)}
                      <p className="text-lg font-semibold capitalize">{todayAttendance.status}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Check In</p>
                    <p className="text-lg font-semibold">
                      {todayAttendance.check_in_time
                        ? format(new Date(todayAttendance.check_in_time), "hh:mm a")
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Check Out</p>
                    <p className="text-lg font-semibold">
                      {todayAttendance.check_out_time
                        ? format(new Date(todayAttendance.check_out_time), "hh:mm a")
                        : "-"}
                    </p>
                  </div>
                </div>
                {!todayAttendance.check_out_time && (
                  <Button onClick={handleCheckOut} disabled={loading} className="w-full">
                    Check Out
                  </Button>
                )}
              </>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">You haven't checked in today</p>
                <Button onClick={handleCheckIn} disabled={loading} size="lg" className="w-full">
                  <Clock className="mr-2 h-5 w-5" />
                  Check In Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Present Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-present">{stats.present}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Absent Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-absent">{stats.absent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Late Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-late">{stats.late}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalHours.toFixed(1)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAttendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={getStatusColor(record.status)}>
                      {getStatusIcon(record.status)}
                    </div>
                    <div>
                      <p className="font-medium">{format(new Date(record.date), "MMM dd, yyyy")}</p>
                      <p className="text-sm text-muted-foreground capitalize">{record.status}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{record.total_hours}h</p>
                    <p className="text-xs text-muted-foreground">
                      {record.check_in_time
                        ? format(new Date(record.check_in_time), "hh:mm a")
                        : "-"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
