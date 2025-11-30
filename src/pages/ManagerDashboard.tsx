import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, LogOut, FileText, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
}

interface Employee {
  id: string;
  name: string;
  employee_id: string;
  department: string;
}

const ManagerDashboard = () => {
  const { profile, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
  });
  const [absentEmployees, setAbsentEmployees] = useState<Employee[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.role === "manager") {
      fetchDashboardData();
    } else {
      navigate("/");
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    const today = format(new Date(), "yyyy-MM-dd");

    // Fetch all employees
    const { data: employees } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "employee");

    const totalEmployees = employees?.length || 0;

    // Fetch today's attendance
    const { data: todayAttendance } = await supabase
      .from("attendance")
      .select("*, profiles(*)")
      .eq("date", today);

    const presentToday = todayAttendance?.filter((a) => a.status === "present").length || 0;
    const lateToday = todayAttendance?.filter((a) => a.status === "late").length || 0;
    const absentToday = totalEmployees - (todayAttendance?.length || 0);

    // Find absent employees
    const attendedIds = todayAttendance?.map((a) => a.user_id) || [];
    const absent = employees?.filter((e) => !attendedIds.includes(e.id)) || [];

    setStats({ totalEmployees, presentToday, absentToday, lateToday });
    setAbsentEmployees(absent);

    // Fetch weekly data
    const weeklyStats = await fetchWeeklyData();
    setWeeklyData(weeklyStats);
  };

  const fetchWeeklyData = async () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayName = format(date, "EEE");

      const { data } = await supabase
        .from("attendance")
        .select("status")
        .eq("date", dateStr);

      const present = data?.filter((a) => a.status === "present").length || 0;
      const absent = data?.filter((a) => a.status === "absent").length || 0;
      const late = data?.filter((a) => a.status === "late").length || 0;

      days.push({ day: dayName, present, absent, late });
    }
    return days;
  };

  const pieData = [
    { name: "Present", value: stats.presentToday, color: "hsl(var(--present))" },
    { name: "Absent", value: stats.absentToday, color: "hsl(var(--absent))" },
    { name: "Late", value: stats.lateToday, color: "hsl(var(--late))" },
  ];

  if (profile?.role !== "manager") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Manager Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {profile?.name} • {profile?.employee_id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/all-employees")}>
              <Users className="mr-2 h-4 w-4" />
              All Employees
            </Button>
            <Button variant="outline" onClick={() => navigate("/reports")}>
              <FileText className="mr-2 h-4 w-4" />
              Reports
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalEmployees}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Present Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-present">{stats.presentToday}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Absent Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-absent">{stats.absentToday}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Late Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-late">{stats.lateToday}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Attendance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="present" fill="hsl(var(--present))" />
                  <Bar dataKey="late" fill="hsl(var(--late))" />
                  <Bar dataKey="absent" fill="hsl(var(--absent))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today's Attendance Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Absent Employees */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Absent Employees Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {absentEmployees.length > 0 ? (
              <div className="space-y-3">
                {absentEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {employee.employee_id} • {employee.department}
                      </p>
                    </div>
                    <div className="text-absent font-medium">Absent</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                All employees are present today! 🎉
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ManagerDashboard;
