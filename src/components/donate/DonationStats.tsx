import { Heart, Shield, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DonationTotals {
  total: number;
  donations: number;
  donors: number;
  byMethod: {
    mpesa: { amount: number; donations: number; donors: number };
    stripe: { amount: number; donations: number; donors: number };
    paypal: { amount: number; donations: number; donors: number };
    direct: { amount: number; donations: number; donors: number };
  };
}

const DonationStats = () => {
  // Updated baseline stats with the new values
  const [stats, setStats] = useState<DonationTotals>({
    total: 7957750,        // Ksh 7,957,750
    donations: 2413,
    donors: 0,             // will be calculated from real data
    byMethod: {
      mpesa: { amount: 733896, donations: 2339, donors: 1972 },
      stripe: { amount: 82891, donations: 30, donors: 24 },
      paypal: { amount: 28313, donations: 13, donors: 13 },
      direct: { amount: 7112650, donations: 31, donors: 0 },
    },
  });

  const [exchangeRates] = useState<Record<string, number>>({
    AUD: 84,
    CAD: 92,
    CHF: 160,
    CNY: 18,
    ETB: 1,
    EUR: 149,
  });

  // Fetch from Supabase and subscribe to updates
  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase
        .from("donations")
        .select("amount, payment_method, email, status")
        .eq("status", "completed");

      if (data && data.length > 0) {
        // Start with the baseline (or zero) and add real-time donations
        const totals: DonationTotals = {
          total: 0,
          donations: 0,
          donors: 0,
          byMethod: {
            mpesa: { amount: 0, donations: 0, donors: 0 },
            stripe: { amount: 0, donations: 0, donors: 0 },
            paypal: { amount: 0, donations: 0, donors: 0 },
            direct: { amount: 0, donations: 0, donors: 0 },
          },
        };

        const uniqueEmails = new Set<string>();
        const methodEmails: Record<string, Set<string>> = {
          mpesa: new Set(),
          stripe: new Set(),
          paypal: new Set(),
          direct: new Set(),
        };

        data.forEach((donation) => {
          totals.total += Number(donation.amount);
          totals.donations++;
          if (donation.email) uniqueEmails.add(donation.email);

          const method =
            donation.payment_method in totals.byMethod
              ? (donation.payment_method as keyof typeof totals.byMethod)
              : "direct";

          totals.byMethod[method].amount += Number(donation.amount);
          totals.byMethod[method].donations++;
          if (donation.email) methodEmails[method].add(donation.email);
        });

        totals.donors = uniqueEmails.size;
        Object.keys(methodEmails).forEach((method) => {
          const key = method as keyof typeof totals.byMethod;
          totals.byMethod[key].donors = methodEmails[method].size;
        });

        // Merge the baseline stats with the real-time donations
        // (since the database may only contain new donations, we add them to the baseline)
        setStats((prev) => ({
          total: prev.total + totals.total,
          donations: prev.donations + totals.donations,
          donors: prev.donors + totals.donors,
          byMethod: {
            mpesa: {
              amount: prev.byMethod.mpesa.amount + totals.byMethod.mpesa.amount,
              donations: prev.byMethod.mpesa.donations + totals.byMethod.mpesa.donations,
              donors: prev.byMethod.mpesa.donors + totals.byMethod.mpesa.donors,
            },
            stripe: {
              amount: prev.byMethod.stripe.amount + totals.byMethod.stripe.amount,
              donations: prev.byMethod.stripe.donations + totals.byMethod.stripe.donations,
              donors: prev.byMethod.stripe.donors + totals.byMethod.stripe.donors,
            },
            paypal: {
              amount: prev.byMethod.paypal.amount + totals.byMethod.paypal.amount,
              donations: prev.byMethod.paypal.donations + totals.byMethod.paypal.donations,
              donors: prev.byMethod.paypal.donors + totals.byMethod.paypal.donors,
            },
            direct: {
              amount: prev.byMethod.direct.amount + totals.byMethod.direct.amount,
              donations: prev.byMethod.direct.donations + totals.byMethod.direct.donations,
              donors: prev.byMethod.direct.donors + totals.byMethod.direct.donors,
            },
          },
        }));
      }
      // else: keep default values
    };

    fetchStats();

    const channel = supabase
      .channel("donations-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "donations",
        },
        () => fetchStats()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const formatAmount = (amount: number) => `Ksh ${amount.toLocaleString()}`;

  const paymentMethods = [
    { id: "mpesa", label: "M-Pesa", ...stats.byMethod.mpesa },
    { id: "stripe", label: "Stripe", ...stats.byMethod.stripe },
    { id: "paypal", label: "PayPal", ...stats.byMethod.paypal },
    { id: "direct", label: "Direct Paybill", ...stats.byMethod.direct },
  ];

  return (
    <div className="space-y-6">
      {/* Live Donation Progress */}
      <div className="bg-card rounded-2xl shadow-card border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-heading font-bold text-foreground">
            Live Donation Progress
          </h2>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
        </div>

        <div className="mb-6">
          <div className="text-3xl font-bold text-primary mb-1">
            {formatAmount(stats.total)}{" "}
            <span className="text-base font-normal text-muted-foreground">
              raised
            </span>
          </div>
          <p className="text-sm text-primary">
            From {stats.donations.toLocaleString()} donations
          </p>
          <p className="text-sm text-primary">Real-time updates</p>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <div key={method.id} className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-foreground">{method.label}</span>
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              </div>
              <div className="text-lg font-bold text-primary">
                {formatAmount(method.amount)}
              </div>
              <div className="text-sm text-muted-foreground">
                {method.donations} donations • {method.donors} donors
              </div>
              <p className="text-xs text-primary mt-1">
                {method.id === "direct" ? "" : "⚡ "}Real-time updates
              </p>
            </div>
          ))}
        </div>

        {/* Exchange Rates */}
        <div className="mt-6 border-t border-border pt-4 space-y-2">
          <h3 className="font-semibold text-foreground">Exchange Rates (to KES)</h3>
          <ul className="text-sm text-muted-foreground">
            {Object.entries(exchangeRates).map(([currency, rate]) => (
              <li key={currency}>
                1 {currency} = {rate} KES
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-1">
            Updated: 13 currencies available
          </p>
          <p className="text-xs text-muted-foreground">Last updated: 12:30:52</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="hidden md:block space-y-4">
        <button className="w-full bg-card rounded-xl shadow-card border border-border p-4 flex items-center justify-between hover:shadow-elevated transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-foreground">Why Your Support Matters</h4>
              <p className="text-sm text-muted-foreground">
                See how your contribution makes a difference
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        <button className="w-full bg-card rounded-xl shadow-card border border-border p-4 flex items-center justify-between hover:shadow-elevated transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-foreground">Privacy & Data Protection</h4>
              <p className="text-sm text-muted-foreground">Our commitment to your privacy</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default DonationStats;
