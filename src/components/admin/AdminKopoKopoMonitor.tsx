import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Smartphone,
  Loader2,
  Zap,
  Filter,
  X,
  CalendarRange,
  Store,
} from "lucide-react";
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
  till: string | null;
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

const formatDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

const toStartOfDay = (dateStr: string) => `${dateStr}T00:00:00.000Z`;
const toEndOfDay = (dateStr: string) => `${dateStr}T23:59:59.999Z`;

const AdminKopoKopoMonitor = () => {
  const [txns, setTxns] = useState<K2Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [lastPoll, setLastPoll] = useState<Date | null>(null);

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [tillFilter, setTillFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filtersRef = useRef({ dateFrom, dateTo, tillFilter, statusFilter });
  filtersRef.current = { dateFrom, dateTo, tillFilter, statusFilter };

  const hasActiveFilters = dateFrom || dateTo || tillFilter || statusFilter !== "all";

  const buildQuery = useCallback(() => {
    let q = supabase
      .from("kopokopo_transactions")
      .select("id, donation_id, reference, amount, msisdn, status, created_at, updated_at, raw_callback, till")
      .order("created_at", { ascending: false })
      .limit(500);

    const f = filtersRef.current;

    if (f.dateFrom) {
      q = q.gte("created_at", toStartOfDay(f.dateFrom));
    }
    if (f.dateTo) {
      q = q.lte("created_at", toEndOfDay(f.dateTo));
    }
    if (f.tillFilter.trim()) {
      q = q.ilike("till", `%${f.tillFilter.trim()}%`);
    }
    if (f.statusFilter && f.statusFilter !== "all") {
      q = q.eq("status", f.statusFilter);
    }

    return q;
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await buildQuery();
    if (error) toast.error("Failed to load Kopo Kopo transactions");
    setTxns((data || []) as K2Txn[]);
    setLoading(false);
  }, [buildQuery]);

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
    const refresh = setInterval(fetchAll, 10_000);
    const autoPoll = setInterval(() => runPoll(false), 30_000);
    runPoll(false);

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

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setTillFilter("");
    setStatusFilter("all");
    // fetchAll will pick up the cleared values on next run
    setTimeout(() => fetchAll(), 0);
  };

  const stats = {
    total: txns.length,
    pending: txns.filter((t) => t.status === "pending").length,
    completed: txns.filter((t) => t.status === "completed").length,
    failed: txns.filter((t) => t.status === "failed").length,
    totalAmount: txns
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + Number(t.amount), 0),
  };

  // Unique tills for the badge
  const uniqueTills = Array.from(new Set(txns.map((t) => t.till).filter(Boolean)));

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader className="flex flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Smartphone className="w-5 h-5 text-primary shrink-0" /> Kopo Kopo STK Push Monitor
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Live view of every STK push. Auto-polls every 30s · table refreshes every 10s
              {lastPoll && <> · last poll {timeAgo(lastPoll.toISOString())}</>}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters((s) => !s)}
              className={`gap-1.5 ${hasActiveFilters ? "border-primary text-primary" : ""}`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  ON
                </Badge>
              )}
            </Button>
            <Button onClick={() => runPoll(true)} disabled={polling} size="sm" className="gap-1.5">
              {polling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              <span className="hidden sm:inline">Poll Now</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Stat label="Total" value={stats.total} />
            <Stat label="Pending" value={stats.pending} cls="text-amber-600" />
            <Stat label="Completed" value={stats.completed} cls="text-emerald-600" />
            <Stat label="Failed" value={stats.failed} cls="text-rose-600" />
            <Stat
              label="Amount"
              value={`KES ${stats.totalAmount.toLocaleString()}`}
              cls="text-primary"
              isText
            />
          </div>

          {uniqueTills.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Tills:</span>
              {uniqueTills.map((t) => (
                <Badge key={t} variant="outline" className="text-[10px] h-5 px-1.5 cursor-pointer hover:bg-muted"
                  onClick={() => { setTillFilter(t ?? ""); setShowFilters(true); setTimeout(() => fetchAll(), 0); }}>
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-primary" /> Filter Transactions
              </CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 h-8 text-muted-foreground">
                  <X className="w-3.5 h-3.5" /> Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="k2-from" className="text-xs">From Date</Label>
                <Input
                  id="k2-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setTimeout(() => fetchAll(), 0); }}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="k2-to" className="text-xs">To Date</Label>
                <Input
                  id="k2-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setTimeout(() => fetchAll(), 0); }}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="k2-till" className="text-xs">Till Number</Label>
                <Input
                  id="k2-till"
                  type="text"
                  placeholder="e.g. 123456"
                  value={tillFilter}
                  onChange={(e) => { setTillFilter(e.target.value); setTimeout(() => fetchAll(), 0); }}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="k2-status" className="text-xs">Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => { setStatusFilter(v); setTimeout(() => fetchAll(), 0); }}
                >
                  <SelectTrigger id="k2-status" className="h-9">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">STK Pushes</CardTitle>
          <CardDescription>
            {txns.length} transaction{txns.length !== 1 ? "s" : ""} shown
            {hasActiveFilters && " (filtered)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            </div>
          ) : txns.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 space-y-2">
              <p>No Kopo Kopo transactions found</p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
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
                      <th className="py-2 pr-3">Till</th>
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
                        <td className="py-2 pr-3 font-mono text-xs">{t.till || "—"}</td>
                        <td className="py-2 pr-3 font-mono text-xs">{t.reference || "—"}</td>
                        <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">{formatDateTime(t.created_at)}</td>
                        <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">{timeAgo(t.updated_at)}</td>
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
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Till: {t.till || "—"}</span>
                      <span>Ref: {t.reference || "—"}</span>
                    </div>
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

const Stat = ({
  label,
  value,
  cls = "",
  isText = false,
}: {
  label: string;
  value: number | string;
  cls?: string;
  isText?: boolean;
}) => (
  <div className="border border-border p-3">
    <div className="text-xs uppercase text-muted-foreground">{label}</div>
    <div className={`mt-1 font-bold ${isText ? "text-sm sm:text-base" : "text-2xl"} ${cls}`}>{value}</div>
  </div>
);

export default AdminKopoKopoMonitor;
