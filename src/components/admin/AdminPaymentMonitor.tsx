import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertTriangle, CheckCircle2, XCircle, Clock, Activity, Phone, Hash } from "lucide-react";
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
  updated_at?: string | null;
  raw_callback?: any;
  response_code?: string | null;
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

const timeAgo = (iso?: string | null) => {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const extractMessage = (t: Txn): string => {
  const raw = t.raw_callback || {};
  return (
    raw?.event?.errors ||
    raw?.event?.resource?.error_description ||
    raw?.event?.resource?.status ||
    raw?.metadata?.message ||
    raw?.ResultDesc ||
    raw?.resultDesc ||
    raw?.message ||
    t.response_code ||
    "—"
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
      supabase.from("pesaflux_transactions").select("id, donation_id, reference, amount, msisdn, status, created_at, updated_at, raw_callback, response_code").order("created_at", { ascending: false }).limit(100),
      supabase.from("kopokopo_transactions").select("id, donation_id, reference, amount, msisdn, status, created_at, updated_at, raw_callback").order("created_at", { ascending: false }).limit(100),
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
    // Refresh "time ago" labels every 10s
    const tick = setInterval(() => setTxns((prev) => [...prev]), 10000);
    return () => {
      supabase.removeChannel(ch);
      clearInterval(tick);
    };
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
  const inFlight = txns.filter((t) => t.status === "pending").slice(0, 5);
  const latest = txns[0];

  // ---------- LIVE STATUS PANEL ----------
  const LiveStatusPanel = () => (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="w-4 h-4 text-primary animate-pulse" />
          Live STK Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!latest ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No transactions yet</p>
        ) : (
          <>
            {/* Most recent transaction — highlighted */}
            <div className="bg-muted/40 p-3 sm:p-4 space-y-2 border border-border">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-[10px]">{latest.provider}</Badge>
                  <span className="font-mono">{latest.reference || latest.id.slice(0, 8)}</span>
                </div>
                <StatusBadge status={latest.status} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-semibold">KES {Number(latest.amount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-mono">{latest.msisdn}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Initiated</p>
                  <p>{timeAgo(latest.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last poll</p>
                  <p className="font-medium">{timeAgo(latest.updated_at || latest.created_at)}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-border/50">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Last response</p>
                <p className="text-xs mt-0.5 break-words">{extractMessage(latest)}</p>
              </div>
            </div>

            {/* Other in-flight */}
            {inFlight.length > 1 && (
              <div className="space-y-1.5">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Other in-flight ({inFlight.length - 1})</p>
                {inFlight.slice(1).map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-2 text-xs p-2 bg-muted/20 border border-border/50">
                    <span className="font-mono truncate">{t.reference || t.id.slice(0, 8)}</span>
                    <span className="text-muted-foreground hidden sm:inline">{t.msisdn}</span>
                    <span className="text-muted-foreground">{timeAgo(t.updated_at || t.created_at)}</span>
                    <StatusBadge status={t.status} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  // ---------- Mobile card row ----------
  const MobileTxnCard = ({ t }: { t: Txn }) => (
    <div className="p-3 border border-border bg-card space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary" className="text-[10px]">{t.provider}</Badge>
        <StatusBadge status={t.status} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1 text-muted-foreground"><Hash className="w-3 h-3" /><span className="font-mono truncate">{t.reference || "—"}</span></div>
        <div className="text-right font-semibold">KES {Number(t.amount).toLocaleString()}</div>
        <div className="flex items-center gap-1 text-muted-foreground"><Phone className="w-3 h-3" />{t.msisdn}</div>
        <div className="text-right text-muted-foreground">{timeAgo(t.created_at)}</div>
      </div>
      {t.status === "pending" && (
        <Button size="sm" variant="outline" onClick={() => handleRetry(t)} disabled={retrying === t.id} className="w-full">
          <RefreshCw className={`w-3 h-3 mr-1 ${retrying === t.id ? "animate-spin" : ""}`} /> Retry
        </Button>
      )}
    </div>
  );

  const renderTxnRow = (t: Txn) => (
    <tr key={`${t.provider}-${t.id}`} className="border-b hover:bg-muted/30">
      <td className="p-2 text-xs font-mono">{t.reference || "—"}</td>
      <td className="p-2"><Badge variant="secondary">{t.provider}</Badge></td>
      <td className="p-2 font-medium">KES {Number(t.amount).toLocaleString()}</td>
      <td className="p-2 text-xs">{t.msisdn}</td>
      <td className="p-2"><StatusBadge status={t.status} /></td>
      <td className="p-2 text-xs text-muted-foreground">{timeAgo(t.updated_at || t.created_at)}</td>
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
    <div className="space-y-4">
      <LiveStatusPanel />

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3">
          <CardTitle className="text-base sm:text-lg">Payment Monitor</CardTitle>
          <Button size="sm" variant="outline" onClick={fetchAll} disabled={loading} className="w-full sm:w-auto">
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <Tabs defaultValue="live">
            <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
              <TabsTrigger value="live" className="text-xs sm:text-sm">Live ({txns.length})</TabsTrigger>
              <TabsTrigger value="stuck" className="text-xs sm:text-sm">
                Stuck {stuck.length > 0 && <Badge variant="destructive" className="ml-1">{stuck.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="text-xs sm:text-sm">Webhooks ({logs.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="live" className="mt-4">
              {/* Mobile cards */}
              <div className="grid gap-2 sm:hidden">
                {txns.map((t) => <MobileTxnCard key={`m-${t.provider}-${t.id}`} t={t} />)}
              </div>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="p-2">Reference</th><th className="p-2">Provider</th><th className="p-2">Amount</th>
                    <th className="p-2">Phone</th><th className="p-2">Status</th><th className="p-2">Last poll</th><th className="p-2"></th>
                  </tr></thead>
                  <tbody>{txns.map(renderTxnRow)}</tbody>
                </table>
              </div>
              {!loading && txns.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No transactions yet</p>}
            </TabsContent>

            <TabsContent value="stuck" className="mt-4">
              {stuck.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 flex items-center justify-center gap-2 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> No stuck payments
                </p>
              ) : (
                <>
                  <div className="grid gap-2 sm:hidden">
                    {stuck.map((t) => <MobileTxnCard key={`sm-${t.provider}-${t.id}`} t={t} />)}
                  </div>
                  <div className="hidden sm:block overflow-x-auto">
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
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="webhooks" className="mt-4">
              {/* Mobile cards */}
              <div className="grid gap-2 sm:hidden">
                {logs.map((l) => (
                  <div key={`m-${l.id}`} className="p-3 border border-border bg-card space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-[10px]">{l.provider}</Badge>
                      <span className="text-muted-foreground">{timeAgo(l.created_at)}</span>
                    </div>
                    <p className="font-medium">{l.event_type || "—"}</p>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1">Sig: {l.signature_valid ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-rose-500" />}</span>
                      <span className="flex items-center gap-1">Done: {l.processed ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-amber-500" />}</span>
                    </div>
                    {l.error && <p className="text-rose-600 break-words">{l.error}</p>}
                  </div>
                ))}
              </div>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
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
              </div>
              {!loading && logs.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No webhook events yet</p>}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPaymentMonitor;
