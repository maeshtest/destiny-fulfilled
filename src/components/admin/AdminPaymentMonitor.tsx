import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

type Txn = {
  id: string;
  donation_id: string | null;
  reference: string | null;
  amount: number;
  msisdn: string;
  status: string;
  provider: "pesaflux" | "kopokopo";
  created_at: string;
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { cls: string; icon: any }> = {
    completed: { cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: CheckCircle2 },
    pending: { cls: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: Clock },
    failed: { cls: "bg-rose-500/10 text-rose-600 border-rose-500/30", icon: XCircle },
  };
  const m = map[status] ?? map.pending;
  const Icon = m.icon;
  return (
    <Badge variant="outline" className={`${m.cls} gap-1`}>
      <Icon className="w-3 h-3" /> {status}
    </Badge>
  );
};

const AdminPaymentMonitor = () => {
  const [txns, setTxns] = useState<Txn[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [pf, k2, lg] = await Promise.all([
      supabase.from("pesaflux_transactions").select("id, donation_id, reference, amount, msisdn, status, created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("kopokopo_transactions").select("id, donation_id, reference, amount, msisdn, status, created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("webhook_logs").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    const merged: Txn[] = [
      ...((pf.data || []).map((t: any) => ({ ...t, provider: "pesaflux" as const }))),
      ...((k2.data || []).map((t: any) => ({ ...t, provider: "kopokopo" as const }))),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setTxns(merged);
    setLogs(lg.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel("payment-monitor")
      .on("postgres_changes", { event: "*", schema: "public", table: "pesaflux_transactions" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "kopokopo_transactions" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "webhook_logs" }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchAll]);

  const handleRetry = async (t: Txn) => {
    if (!t.donation_id) { toast.error("No donation linked"); return; }
    setRetrying(t.id);
    try {
      const { data, error } = await supabase.functions.invoke("payment-retry", {
        body: { donationId: t.donation_id, provider: t.provider },
      });
      if (error) throw error;
      toast.success(`Retry result: ${JSON.stringify(data?.result?.status ?? data)}`);
      fetchAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Retry failed");
    } finally {
      setRetrying(null);
    }
  };

  const stuck = txns.filter((t) => t.status === "pending" && Date.now() - new Date(t.created_at).getTime() > 2 * 60 * 1000);

  const renderTxnRow = (t: Txn) => (
    <tr key={`${t.provider}-${t.id}`} className="border-b hover:bg-muted/30">
      <td className="p-2 text-xs font-mono">{t.reference || "—"}</td>
      <td className="p-2"><Badge variant="secondary">{t.provider}</Badge></td>
      <td className="p-2 font-medium">KES {Number(t.amount).toLocaleString()}</td>
      <td className="p-2 text-xs">{t.msisdn}</td>
      <td className="p-2"><StatusBadge status={t.status} /></td>
      <td className="p-2 text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</td>
      <td className="p-2">
        {t.status === "pending" && (
          <Button size="sm" variant="outline" onClick={() => handleRetry(t)} disabled={retrying === t.id}>
            <RefreshCw className={`w-3 h-3 mr-1 ${retrying === t.id ? "animate-spin" : ""}`} /> Retry
          </Button>
        )}
      </td>
    </tr>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Payment Monitor</CardTitle>
        <Button size="sm" variant="outline" onClick={fetchAll} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="live">
          <TabsList>
            <TabsTrigger value="live">Live ({txns.length})</TabsTrigger>
            <TabsTrigger value="stuck">
              Stuck {stuck.length > 0 && <Badge variant="destructive" className="ml-2">{stuck.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="webhooks">Webhook Logs ({logs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs text-muted-foreground">
                <th className="p-2">Reference</th><th className="p-2">Provider</th><th className="p-2">Amount</th>
                <th className="p-2">Phone</th><th className="p-2">Status</th><th className="p-2">Time</th><th className="p-2"></th>
              </tr></thead>
              <tbody>{txns.map(renderTxnRow)}</tbody>
            </table>
            {!loading && txns.length === 0 && <p className="text-center text-muted-foreground py-8">No transactions yet</p>}
          </TabsContent>

          <TabsContent value="stuck" className="mt-4 overflow-x-auto">
            {stuck.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> No stuck payments
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="p-2">Reference</th><th className="p-2">Provider</th><th className="p-2">Amount</th>
                  <th className="p-2">Phone</th><th className="p-2">Age</th><th className="p-2"></th>
                </tr></thead>
                <tbody>
                  {stuck.map((t) => (
                    <tr key={`s-${t.provider}-${t.id}`} className="border-b">
                      <td className="p-2 text-xs font-mono">{t.reference || "—"}</td>
                      <td className="p-2"><Badge variant="secondary">{t.provider}</Badge></td>
                      <td className="p-2">KES {Number(t.amount).toLocaleString()}</td>
                      <td className="p-2 text-xs">{t.msisdn}</td>
                      <td className="p-2 text-xs flex items-center gap-1 text-amber-600">
                        <AlertTriangle className="w-3 h-3" />
                        {Math.floor((Date.now() - new Date(t.created_at).getTime()) / 60000)}m
                      </td>
                      <td className="p-2">
                        <Button size="sm" onClick={() => handleRetry(t)} disabled={retrying === t.id}>
                          <RefreshCw className={`w-3 h-3 mr-1 ${retrying === t.id ? "animate-spin" : ""}`} /> Retry
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </TabsContent>

          <TabsContent value="webhooks" className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs text-muted-foreground">
                <th className="p-2">Time</th><th className="p-2">Provider</th><th className="p-2">Event</th>
                <th className="p-2">Signature</th><th className="p-2">Processed</th><th className="p-2">Error</th>
              </tr></thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b hover:bg-muted/30">
                    <td className="p-2 text-xs">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="p-2"><Badge variant="secondary">{l.provider}</Badge></td>
                    <td className="p-2 text-xs">{l.event_type || "—"}</td>
                    <td className="p-2">{l.signature_valid ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}</td>
                    <td className="p-2">{l.processed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-amber-500" />}</td>
                    <td className="p-2 text-xs text-rose-600 max-w-xs truncate">{l.error || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && logs.length === 0 && <p className="text-center text-muted-foreground py-8">No webhook events yet</p>}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminPaymentMonitor;
