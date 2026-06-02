import { useState, useEffect, useTransition, lazy, Suspense, useCallback, startTransition } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard, DollarSign, Users, Settings, LogOut,
  TrendingUp, UserPlus, CreditCard, Key, ShieldCheck,
  MessageSquare, Smartphone, Activity, BarChart3, Clock,
  CheckCircle, XCircle, ArrowUpRight, ArrowDownRight,
  RefreshCw, Zap, Sparkles, Eye, Wifi
} from "lucide-react";
import maragaLogo from "@/assets/maraga-logo.png";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Lazy load heavy admin components
const AdminDonations = lazy(() => import("@/components/admin/AdminDonations"));
const AdminVolunteers = lazy(() => import("@/components/admin/AdminVolunteers"));
const AdminSettings = lazy(() => import("@/components/admin/AdminSettings"));
const AdminSiteContent = lazy(() => import("@/components/admin/AdminSiteContent"));
const AdminDonationVerification = lazy(() => import("@/components/admin/AdminDonationVerification"));
const AdminGatewayConfig = lazy(() => import("@/components/admin/AdminGatewayConfig"));
const AdminSMS = lazy(() => import("@/components/admin/AdminSMS"));
const AdminTransactions = lazy(() => import("@/components/admin/AdminTransactions"));
const AdminMaintenanceToggle = lazy(() => import("@/components/admin/AdminMaintenanceToggle"));
const AdminPaymentMonitor = lazy(() => import("@/components/admin/AdminPaymentMonitor"));
const AdminKopoKopoMonitor = lazy(() => import("@/components/admin/AdminKopoKopoMonitor"));

// Types
interface DashboardStats {
  totalDonations: number;
  totalAmount: number;
  totalVolunteers: number;
  pendingDonations: number;
  completedDonations: number;
  failedDonations: number;
  stkTransactions: number;
  smsSent: number;
  recentDonations: any[];
  recentVolunteers: any[];
  lastUpdated: number;
}

const STATS_CACHE_KEY = "admin_dashboard_stats";
const CACHE_TTL = 60_000;

const SIDEBAR_ITEMS = [
  { id: "overview", label: "Overview", icon: BarChart3, color: "text-primary" },
  { id: "donations", label: "Donations", icon: DollarSign, color: "text-emerald-500" },
  { id: "verification", label: "Verify Payments", icon: ShieldCheck, color: "text-amber-500" },
  { id: "transactions", label: "M-Pesa Txns", icon: Activity, color: "text-blue-500" },
  { id: "monitor", label: "Payment Monitor", icon: Activity, color: "text-cyan-500" },
  { id: "k2-stk", label: "Kopo Kopo STK", icon: Zap, color: "text-green-600" },
  { id: "gateway", label: "M-Pesa Gateway", icon: Smartphone, color: "text-violet-500" },
  { id: "volunteers", label: "Volunteers", icon: Users, color: "text-purple-500" },
  { id: "sms", label: "SMS Manager", icon: MessageSquare, color: "text-pink-500" },
  { id: "content", label: "Site Content", icon: LayoutDashboard, color: "text-indigo-500" },
  { id: "api-config", label: "API Config", icon: Key, color: "text-orange-500" },
  { id: "settings", label: "Settings", icon: Settings, color: "text-slate-500" },
] as const;

const loadCachedStats = (): DashboardStats | null => {
  try {
    const cached = localStorage.getItem(STATS_CACHE_KEY);
    if (!cached) return null;
    const data = JSON.parse(cached);
    if (Date.now() - data.lastUpdated > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
};

const saveStatsToCache = (stats: DashboardStats) => {
  try {
    localStorage.setItem(STATS_CACHE_KEY, JSON.stringify({ ...stats, lastUpdated: Date.now() }));
  } catch {}
};

// Inline admin gateway switcher
const AdminGatewaySwitcher = () => {
  const [gateway, setGateway] = useState<string>("pesaflux");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchGateway = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "active_payment_gateway")
        .single();
      if (!error && data) {
        setGateway(data.value);
      } else {
        setGateway("pesaflux");
      }
      setIsLoading(false);
    };
    fetchGateway();
  }, []);

  const handleSwitch = async (value: string) => {
    setIsSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "active_payment_gateway", value }, { onConflict: "key" });
    if (error) {
      toast.error("Failed to update gateway");
      console.error(error);
    } else {
      setGateway(value);
      toast.success(`Gateway switched to ${value === "kopokopo" ? "Kopo Kopo" : "PesaFlux"}`);
    }
    setIsSaving(false);
  };

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wifi className="w-5 h-5" /> Active M-Pesa Gateway</CardTitle>
        <CardDescription>
          Choose which payment processor handles donor M-Pesa transactions. Donors will never see this option.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant={gateway === "pesaflux" ? "default" : "outline"}
            onClick={() => handleSwitch("pesaflux")}
            disabled={isSaving}
            className="min-w-[140px]"
          >
            PesaFlux
          </Button>
          <Button
            variant={gateway === "kopokopo" ? "default" : "outline"}
            onClick={() => handleSwitch("kopokopo")}
            disabled={isSaving}
            className="min-w-[140px]"
          >
            Kopo Kopo
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          All future M-Pesa donations will be processed through the selected gateway. Existing transactions are unaffected.
        </p>
      </CardContent>
    </Card>
  );
};

const AdminDashboard = () => {
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isPending, startTransition] = useTransition();

  const [stats, setStats] = useState<DashboardStats>(() => {
    const cached = loadCachedStats();
    if (cached) return cached;
    return {
      totalDonations: 0, totalAmount: 0, totalVolunteers: 0,
      pendingDonations: 0, completedDonations: 0, failedDonations: 0,
      stkTransactions: 0, smsSent: 0, recentDonations: [], recentVolunteers: [], lastUpdated: 0,
    };
  });
  const [isLoadingStats, setIsLoadingStats] = useState(!loadCachedStats());
  const [statsError, setStatsError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/admin/login");
  }, [user, isAdmin, authLoading, navigate]);

  const fetchStats = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoadingStats(true);
    setStatsError(null);

    try {
      const [donationsRes, volRes, stkRes, smsRes, recentDonRes, recentVolRes] = await Promise.all([
        supabase.from("donations").select("amount, status"),
        supabase.from("volunteers").select("*", { count: "exact", head: true }),
        supabase.from("pesaflux_transactions").select("*", { count: "exact", head: true }),
        supabase.from("sms_logs").select("*", { count: "exact", head: true }),
        supabase.from("donations").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("volunteers").select("*").order("created_at", { ascending: false }).limit(5),
      ]);

      if (donationsRes.error) throw donationsRes.error;
      if (volRes.error) throw volRes.error;
      if (stkRes.error) throw stkRes.error;
      if (smsRes.error) throw smsRes.error;
      if (recentDonRes.error) throw recentDonRes.error;
      if (recentVolRes.error) throw recentVolRes.error;

      const donations = donationsRes.data || [];
      const newStats: DashboardStats = {
        totalDonations: donations.length,
        totalAmount: donations
          .filter(d => d.status === "completed")
          .reduce((sum, d) => sum + Number(d.amount), 0),
        pendingDonations: donations.filter(d => d.status === "pending").length,
        completedDonations: donations.filter(d => d.status === "completed").length,
        failedDonations: donations.filter(d => d.status === "failed").length,
        totalVolunteers: volRes.count ?? 0,
        stkTransactions: stkRes.count ?? 0,
        smsSent: smsRes.count ?? 0,
        recentDonations: recentDonRes.data || [],
        recentVolunteers: recentVolRes.data || [],
        lastUpdated: Date.now(),
      };

      setStats(newStats);
      saveStatsToCache(newStats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setStatsError("Failed to load dashboard data.");
    } finally {
      setIsLoadingStats(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user && isAdmin) {
      fetchStats();
      const interval = setInterval(() => fetchStats(), 30000);
      return () => clearInterval(interval);
    }
  }, [user, isAdmin, fetchStats]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const handleTabChange = (tabId: string) => {
    startTransition(() => setActiveTab(tabId));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(215,50%,12%)] to-[hsl(215,50%,8%)]">
        <div className="relative">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-pulse" />
        </div>
      </div>
    );
  }
  if (!user || !isAdmin) return null;

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }: any) => (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-l-4 border-l-primary">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold mt-1 flex items-baseline gap-1">
              {value}
              {trend && (
                <span className={cn("text-xs font-medium ml-1", trend > 0 ? "text-emerald-500" : "text-rose-500")}>
                  {trend > 0 ? <ArrowUpRight className="inline w-3 h-3" /> : <ArrowDownRight className="inline w-3 h-3" />}
                  {Math.abs(trend)}%
                </span>
              )}
            </p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all group-hover:scale-110", color)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-r border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <img src={maragaLogo} alt="Maraga '27" className="h-8" />
            <div>
              <p className="font-heading font-bold text-sm">Admin Panel</p>
              <p className="text-xs text-muted-foreground">Maraga 2027</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                activeTab === item.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {activeTab === item.id && <Zap className="w-3 h-3 ml-auto opacity-70" />}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2 truncate flex items-center gap-1">
            <Eye className="w-3 h-3" /> {user.email}
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full gap-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-border px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img src={maragaLogo} alt="Maraga '27" className="h-7 lg:hidden shrink-0" />
            <h1 className="text-base sm:text-xl font-heading font-bold bg-gradient-to-r from-primary to-campaign-gold bg-clip-text text-transparent truncate">
              {SIDEBAR_ITEMS.find(i => i.id === activeTab)?.label || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {stats.lastUpdated > 0 && (
              <span className="text-xs text-muted-foreground hidden sm:inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(stats.lastUpdated).toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchStats(true)}
              disabled={isRefreshing}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="lg:hidden gap-1">
              <LogOut className="w-4 h-4" /> Exit
            </Button>
          </div>
        </header>

        <div className="lg:hidden overflow-x-auto border-b border-border bg-muted/30">
          <div className="flex p-2 gap-1 min-w-max">
            {SIDEBAR_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-all",
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className={cn("transition-opacity duration-300", isPending ? "opacity-70" : "opacity-100")}>
            {activeTab === "overview" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <h1 className="text-3xl font-heading font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      Welcome back, {user.email?.split('@')[0] || "Admin"} 👋
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">Campaign heartbeat & real-time insights</p>
                  </div>
                  {isLoadingStats && !isRefreshing && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Syncing...
                    </div>
                  )}
                </div>

                {statsError && (
                  <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="pt-6 pb-6 text-center">
                      <p className="text-destructive mb-3">{statsError}</p>
                      <Button onClick={() => fetchStats()} variant="outline" size="sm">Retry</Button>
                    </CardContent>
                  </Card>
                )}

                {isLoadingStats && !stats.totalAmount ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <Card key={i}><CardContent className="pt-5 pb-4"><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-8 w-24" /></CardContent></Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard title="Total Raised" value={`KES ${stats.totalAmount.toLocaleString()}`} icon={DollarSign} color="bg-primary/10 text-primary" subtitle="All time" />
                    <StatCard title="Donations" value={stats.totalDonations} icon={TrendingUp} color="bg-campaign-gold/10 text-campaign-gold" subtitle={`${stats.pendingDonations} pending`} />
                    <StatCard title="Volunteers" value={stats.totalVolunteers} icon={UserPlus} color="bg-blue-500/10 text-blue-500" subtitle="Active supporters" />
                    <StatCard title="SMS Sent" value={stats.smsSent} icon={MessageSquare} color="bg-purple-500/10 text-purple-500" subtitle="Campaign reach" />
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                    <CardContent className="pt-5 pb-4 flex items-center gap-4">
                      <CheckCircle className="w-8 h-8 text-emerald-500" />
                      <div><p className="text-xs text-muted-foreground">Completed</p><p className="text-xl font-bold text-emerald-600">{stats.completedDonations}</p></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                    <CardContent className="pt-5 pb-4 flex items-center gap-4">
                      <Clock className="w-8 h-8 text-amber-500" />
                      <div><p className="text-xs text-muted-foreground">Pending</p><p className="text-xl font-bold text-amber-600">{stats.pendingDonations}</p></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800">
                    <CardContent className="pt-5 pb-4 flex items-center gap-4">
                      <XCircle className="w-8 h-8 text-rose-500" />
                      <div><p className="text-xs text-muted-foreground">Failed</p><p className="text-xl font-bold text-rose-600">{stats.failedDonations}</p></div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <Card className="overflow-hidden">
                    <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><CreditCard className="w-4 h-4" /> Recent Donations</CardTitle><CardDescription>Latest 5 gifts</CardDescription></CardHeader>
                    <CardContent>
                      {isLoadingStats && !stats.recentDonations.length ? (
                        <div className="space-y-3">{[...Array(3)].map((_,i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                      ) : stats.recentDonations.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No donations yet</p>
                      ) : (
                        <div className="space-y-2">
                          {stats.recentDonations.map((d: any) => (
                            <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                              <div><p className="font-medium text-sm">{d.name || "Anonymous"}</p><p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</p></div>
                              <div className="text-right"><p className="font-bold text-sm text-primary">{d.currency} {Number(d.amount).toLocaleString()}</p><span className={cn("text-xs font-medium", d.status === "completed" ? "text-emerald-500" : d.status === "failed" ? "text-rose-500" : "text-amber-500")}>{d.status}</span></div>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button variant="ghost" size="sm" className="w-full mt-3 gap-1" onClick={() => handleTabChange("donations")}>View all <ArrowUpRight className="w-3 h-3" /></Button>
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden">
                    <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" /> Recent Volunteers</CardTitle><CardDescription>Latest sign-ups</CardDescription></CardHeader>
                    <CardContent>
                      {isLoadingStats && !stats.recentVolunteers.length ? (
                        <div className="space-y-3">{[...Array(3)].map((_,i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                      ) : stats.recentVolunteers.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No volunteers yet</p>
                      ) : (
                        <div className="space-y-2">
                          {stats.recentVolunteers.map((v: any) => (
                            <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                              <div><p className="font-medium text-sm">{v.name}</p><p className="text-xs text-muted-foreground">{v.email}</p></div>
                              <div className="text-right"><p className="text-xs text-muted-foreground">{v.county || "—"}</p><p className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</p></div>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button variant="ghost" size="sm" className="w-full mt-3 gap-1" onClick={() => handleTabChange("volunteers")}>View all <ArrowUpRight className="w-3 h-3" /></Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-base">⚡ Quick Actions</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 hover:scale-105 transition-transform" onClick={() => handleTabChange("verification")}><ShieldCheck className="w-5 h-5 text-primary" /><span className="text-xs">Verify Payments</span></Button>
                      <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 hover:scale-105 transition-transform" onClick={() => handleTabChange("sms")}><MessageSquare className="w-5 h-5 text-primary" /><span className="text-xs">Send SMS</span></Button>
                      <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 hover:scale-105 transition-transform" onClick={() => handleTabChange("content")}><LayoutDashboard className="w-5 h-5 text-primary" /><span className="text-xs">Manage Goals</span></Button>
                      <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 hover:scale-105 transition-transform" onClick={() => handleTabChange("gateway")}><Smartphone className="w-5 h-5 text-primary" /><span className="text-xs">M-Pesa Gateway</span></Button>
                    </CardContent>
                  </Card>
                  <Suspense fallback={<Card><CardContent className="py-10 text-center">Loading maintenance...</CardContent></Card>}>
                    <AdminMaintenanceToggle />
                  </Suspense>
                </div>
              </div>
            )}

            <Suspense fallback={<div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
              {activeTab === "donations" && <AdminDonations />}
              {activeTab === "verification" && (
                <Card><CardHeader><CardTitle>Payment Verification</CardTitle><CardDescription>Review and verify manual M-Pesa payments</CardDescription></CardHeader><CardContent><AdminDonationVerification /></CardContent></Card>
              )}
              {activeTab === "transactions" && <AdminTransactions />}
              {activeTab === "monitor" && <AdminPaymentMonitor />}
              {activeTab === "k2-stk" && <AdminKopoKopoMonitor />}
              {activeTab === "gateway" && <AdminGatewaySwitcher />}
              {activeTab === "volunteers" && <AdminVolunteers />}
              {activeTab === "sms" && <AdminSMS />}
              {activeTab === "content" && <AdminSiteContent />}
              {activeTab === "api-config" && <AdminGatewayConfig />}
              {activeTab === "settings" && (
                <Card><CardHeader><CardTitle>General Settings</CardTitle><CardDescription>Manage campaign settings and configurations</CardDescription></CardHeader><CardContent><AdminSettings settingsFilter="general" /></CardContent></Card>
              )}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
