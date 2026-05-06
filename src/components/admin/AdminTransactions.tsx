import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("pesaflux_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setTransactions(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchTransactions(); }, []);

  const statusColor = (s: string) => {
    if (s === "completed") return "default";
    if (s === "failed") return "destructive";
    return "secondary";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>M-Pesa Transactions</CardTitle>
          <CardDescription>PesaFlux STK Push transaction history</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTransactions}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="font-mono text-sm">{txn.msisdn}</TableCell>
                    <TableCell className="font-semibold">KES {Number(txn.amount).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{txn.reference || "—"}</TableCell>
                    <TableCell className="font-mono text-sm">{txn.receipt || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusColor(txn.status)}>{txn.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(txn.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No transactions yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminTransactions;
