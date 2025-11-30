import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, ArrowLeft, Download } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AttendanceReport {
  date: string;
  employee_name: string;
  employee_id: string;
  department: string;
  status: string;
  check_in: string;
  check_out: string;
  total_hours: number;
}

const Reports = () => {
  const { profile } = useAuth();
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const exportToCSV = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          *,
          profiles (
            name,
            employee_id,
            department
          )
        `)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error("No data found for the selected date range");
        return;
      }

      // Convert to CSV format
      const csvData: AttendanceReport[] = data.map((record) => ({
        date: record.date,
        employee_name: record.profiles.name,
        employee_id: record.profiles.employee_id,
        department: record.profiles.department,
        status: record.status,
        check_in: record.check_in_time ? format(new Date(record.check_in_time), "hh:mm a") : "-",
        check_out: record.check_out_time ? format(new Date(record.check_out_time), "hh:mm a") : "-",
        total_hours: record.total_hours,
      }));

      // Create CSV string
      const headers = [
        "Date",
        "Employee Name",
        "Employee ID",
        "Department",
        "Status",
        "Check In",
        "Check Out",
        "Total Hours",
      ];
      const csvContent = [
        headers.join(","),
        ...csvData.map((row) =>
          [
            row.date,
            row.employee_name,
            row.employee_id,
            row.department,
            row.status,
            row.check_in,
            row.check_out,
            row.total_hours,
          ].join(",")
        ),
      ].join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `attendance_report_${startDate}_to_${endDate}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Report exported successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to export report");
    } finally {
      setLoading(false);
    }
  };

  if (profile?.role !== "manager") {
    navigate("/");
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
              <h1 className="text-xl font-bold">Attendance Reports</h1>
              <p className="text-sm text-muted-foreground">Export attendance data as CSV</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Export Attendance Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                  />
                </div>
              </div>

              <Button onClick={exportToCSV} disabled={loading} className="w-full" size="lg">
                <Download className="mr-2 h-5 w-5" />
                {loading ? "Exporting..." : "Export to CSV"}
              </Button>

              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> The exported CSV file will contain the following columns:
                  Date, Employee Name, Employee ID, Department, Status, Check In, Check Out, and
                  Total Hours for all employees in the selected date range.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Reports;
