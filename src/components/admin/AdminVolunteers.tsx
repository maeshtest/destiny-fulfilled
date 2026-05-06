import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  county: string | null;
  constituency: string | null;
  created_at: string;
}

const AdminVolunteers = () => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVolunteers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("volunteers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch volunteers");
      console.error(error);
    } else {
      setVolunteers(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Phone", "County", "Constituency", "Date"];
    const rows = volunteers.map(v => [
      v.name,
      v.email,
      v.phone || "-",
      v.county || "-",
      v.constituency || "-",
      new Date(v.created_at).toLocaleDateString(),
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `volunteers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Volunteers</CardTitle>
            <CardDescription>
              View all registered campaign volunteers
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchVolunteers}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : volunteers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No volunteers registered yet
                  </TableCell>
                </TableRow>
              ) : (
                volunteers.map((volunteer) => (
                  <TableRow key={volunteer.id}>
                    <TableCell className="font-medium">{volunteer.name}</TableCell>
                    <TableCell>{volunteer.email}</TableCell>
                    <TableCell>{volunteer.phone || "-"}</TableCell>
                    <TableCell>
                      {volunteer.county && volunteer.constituency
                        ? `${volunteer.constituency}, ${volunteer.county}`
                        : volunteer.county || volunteer.constituency || "-"}
                    </TableCell>
                    <TableCell>{new Date(volunteer.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminVolunteers;
