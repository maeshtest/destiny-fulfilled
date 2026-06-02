import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, XCircle, Clock, Smartphone, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

type K2Txn = {
  id: string;
  donation_id: string | null;
  reference: string | null;
  amount: number;
  msisdn: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  raw_callback: any;
};

const StatusPill = ({ status }: { status: string }) => {
  const map: Record<string, { cls: string; Icon: any }> = {
    completed: { cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", Icon: CheckCircle2 },
    pending: { cls: "bg-amber-500/10 text-amber-600 border-amber-500/30", Icon: Clock },
    failed: { cls: "bg-rose-500/10 text-rose-600 border-rose-500/30", Icon: XCircle },
  };
  const m = map[status] ?? map.pending;
  return (
    <Badge variant="outline" className={`${m.cls} gap-1`}>
      <m.Icon className="w-3 h-3" /> {status}
    </Badge>
  );
};

const timeAgo = (iso?: string | null) => {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const extractMsg = (raw: any): string => {
  if (!raw) return "—";
  return (
    raw?.event?.errors ||
    raw?.event?.resource?.error_description ||
    raw?.event?.resource?.status ||
    raw?.metadata?.message ||
    raw?.status ||
    "—"
  );
};

const AdminKopoKopoMonitor = () => {
  const [txns, setTxns] = useState<K2Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [lastPoll, setLastPoll] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    const { data, error } = await supabase
      .from("kopokopo_transactions")
      .select("id, donation_id, reference, amount, msisdn, status, created_at, updated_at, raw_callback")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) toast.error("Failed to load Kopo Kopo transactions");
    setTxns((data || []) as K2Txn[]);
    setLoading(false);
  }, []);

  const runPoll = useCallback(async (manual = false) => {
    setPolling(true);
    try {
      const { data, error } = await supabase.functions.invoke("kopokopo-auto-poll", { body: {} });
      if (error) throw error;
      setLastPoll(new Date());
      if (manual) toast.success(`Polled ${data?.polled ?? 0} pending transaction(s)`);
      await fetchAll();
    } catch (e: any) {
      if (manual) toast.error(e.message || "Poll failed");
    } finally {
      setPolling(false);
    }
  }, [fetchAll]);

  useEffect(() => {
    fetchAll();
    // Auto-refresh table every 10s + trigger server poll every 30s
    const refresh = setInterval(fetchAll, 10_000);
    const autoPoll = setInterval(() => runPoll(false), 30_000);
    // Initial server poll
    runPoll(false);

    // Realtime updates
    const channel = supabase
      .channel("k2-admin-monitor")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kopokopo_transactions" },
        () => fetchAll()
      )
      .subscribe();

    return () => {
      clearInterval(refresh);
      clearInterval(autoPoll);
      supabase.removeChannel(channel);
    };
  }, [fetchAll, runPoll]);

  const stats = {
    total: txns.length,
    pending: txns.filter((t) => t.status === "pending").length,
    completed: txns.filter((t) => t.status === "completed").length,
    failed: txns.filter((t) => t.status === "failed").length,
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" /> Kopo Kopo STK Push Monitor
            </CardTitle>
            <CardDescription>
              Live view of every STK push. Auto-polls every 30s · table refreshes every 10s
              {lastPoll && <> · last poll {timeAgo(lastPoll.toISOString())}</>}
            </CardDescription>
          </div>
          <Button onClick={() => runPoll(true)} disabled={polling} size="sm" className="gap-2">
            {polling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Poll Now
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Total" value={stats.total} />
            <Stat label="Pending" value={stats.pending} cls="text-amber-600" />
            <Stat label="Completed" value={stats.completed} cls="text-emerald-600" />
            <Stat label="Failed" value={stats.failed} cls="text-rose-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All STK Pushes</CardTitle>
          <CardDescription>Most recent 100 transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            </div>
          ) : txns.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No Kopo Kopo transactions yet</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-muted-foreground border-b">
                    <tr>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Phone</th>
                      <th className="py-2 pr-3">Amount</th>
                      <th className="py-2 pr-3">Reference</th>
                      <th className="py-2 pr-3">Sent</th>
                      <th className="py-2 pr-3">Updated</th>
                      <th className="py-2 pr-3">Gateway message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txns.map((t) => (
                      <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 pr-3"><StatusPill status={t.status} /></td>
                        <td className="py-2 pr-3 font-mono">{t.msisdn}</td>
                        <td className="py-2 pr-3 font-semibold">KES {Number(t.amount).toLocaleString()}</td>
                        <td className="py-2 pr-3 font-mono text-xs">{t.reference || "—"}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{timeAgo(t.created_at)}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{timeAgo(t.updated_at)}</td>
                        <td className="py-2 pr-3 text-xs max-w-[260px] truncate" title={extractMsg(t.raw_callback)}>
                          {extractMsg(t.raw_callback)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {txns.map((t) => (
                  <div key={t.id} className="border border-border p-3 space-y-2 bg-card">
                    <div className="flex items-center justify-between">
                      <StatusPill status={t.status} />
                      <span className="text-xs text-muted-foreground">{timeAgo(t.created_at)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-mono">{t.msisdn}</span>
                      <span className="font-semibold">KES {Number(t.amount).toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Ref: {t.reference || "—"}</div>
                    <div className="text-xs">Updated: {timeAgo(t.updated_at)}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{extractMsg(t.raw_callback)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Stat = ({ label, value, cls = "" }: { label: string; value: number; cls?: string }) => (
  <div className="border border-border p-3">
    <div className="text-xs uppercase text-muted-foreground">{label}</div>
    <div className={`text-2xl font-bold mt-1 ${cls}`}>{value}</div>
  </div>
);

export default AdminKopoKopoMonitor;
