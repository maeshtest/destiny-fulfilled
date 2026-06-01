import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, CheckCircle, XCircle, Smartphone, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import maragaLogo from "@/assets/maraga-logo.png";

interface Props {
  donationId: string;
  amount: string;
  phone: string;
  currency: string;
  name?: string;
  email?: string;
  onComplete: () => void;
  onBack: () => void;
  onFallbackManual: () => void;
  onFallbackStripe?: () => void;
}

type Status = "idle" | "sending" | "waiting" | "completed" | "failed";

const KopoKopoPaymentForm = ({
  donationId,
  amount,
  phone,
  currency,
  name,
  email,
  onComplete,
  onBack,
  onFallbackManual,
  onFallbackStripe,
}: Props) => {
  const [status, setStatus] = useState<Status>("idle");
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(120);
  const [errorMessage, setErrorMessage] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const completedRef = useRef(false);
  const pollingRef = useRef(false);

  const initiate = useCallback(async () => {
    setStatus("sending");
    setErrorMessage("");
    completedRef.current = false;

    try {
      const numericAmount = parseFloat(amount.replace(/,/g, ""));
      if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new Error("Invalid amount");
      }

      // ---------- PHONE NORMALISATION (critical) ----------
      let cleanPhone = phone.replace(/\D/g, "");
      if (cleanPhone.startsWith("0")) cleanPhone = "254" + cleanPhone.slice(1);
      if (!cleanPhone.startsWith("254")) cleanPhone = "254" + cleanPhone;
      // ----------------------------------------------------

      const [firstName, ...rest] = (name || "Donor").trim().split(" ");
      const lastName = rest.join(" ") || "User";

      console.log("Calling kopokopo-stk with:", {
        amount: numericAmount,
        phone: cleanPhone,
        donationId,
      });

      const { data, error } = await supabase.functions.invoke("kopokopo-stk", {
        body: {
          amount: numericAmount,
          msisdn: cleanPhone,
          reference: `DON-${donationId.slice(0, 8)}`,
          donationId,
          firstName: firstName || "Donor",
          lastName: lastName || "User",
          email: email || "",
        },
      });

      // FunctionsHttpError or network error - treat as fallbackable
      if (error) {
        console.error("Edge function error:", error);
        throw new Error("Kopo Kopo service unavailable. Please try card payment or Paybill.");
      }

      if (!data?.success) {
        const msg = data?.error || "Kopo Kopo payment initiation failed";
        throw new Error(msg);
      }

      setTransactionId(data.transaction_id);
      setStatus("waiting");
      setCountdown(120);
      setPollCount(0);
    } catch (err: any) {
      console.error("Kopo Kopo payment initiation error:", err);
      setErrorMessage(err.message || "Failed to initiate payment");
      setStatus("failed");
    }
  }, [amount, phone, donationId, name, email]);

  useEffect(() => {
    initiate();
  }, [initiate]);

  // Countdown timer (display only — does NOT assume success)
  useEffect(() => {
    if (status !== "waiting" || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [status, countdown]);

  // Active polling — query gateway every 5s while waiting
  useEffect(() => {
    if (status !== "waiting" || !transactionId) return;

    let cancelled = false;
    const poll = async () => {
      if (cancelled || completedRef.current || pollingRef.current) return;
      pollingRef.current = true;
      try {
        const { data, error } = await supabase.functions.invoke("kopokopo-status", {
          body: { transactionId },
        });
        if (cancelled || completedRef.current) return;
        setPollCount((n) => n + 1);
        if (!error && data?.status === "completed") {
          completedRef.current = true;
          setStatus("completed");
          setTimeout(onComplete, 2000);
        } else if (!error && data?.status === "failed") {
          completedRef.current = true;
          setStatus("failed");
          setErrorMessage(data?.error || "Payment was declined");
        }
      } catch (err) {
        console.warn("Poll failed:", err);
      } finally {
        pollingRef.current = false;
      }
    };

    // First poll after 8s (give STK time to be answered), then every 5s
    const initial = setTimeout(poll, 8000);
    const interval = setInterval(poll, 5000);

    return () => {
      cancelled = true;
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [status, transactionId, onComplete]);

  // Realtime listener for kopokopo_transactions updates
  useEffect(() => {
    if (status !== "waiting" || !transactionId) return;
    const channel = supabase
      .channel(`k2-${transactionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "kopokopo_transactions",
          filter: `id=eq.${transactionId}`,
        },
        (payload: any) => {
          const newStatus = payload.new?.status;
          if (newStatus === "completed" && !completedRef.current) {
            completedRef.current = true;
            setStatus("completed");
            setTimeout(onComplete, 2000);
          } else if (newStatus === "failed" && !completedRef.current) {
            completedRef.current = true;
            setStatus("failed");
            setErrorMessage(payload.new?.error_message || "Payment was declined");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [status, transactionId, onComplete]);

  // Manual status check
  const checkStatus = async () => {
    if (!transactionId || completedRef.current) return;
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("kopokopo-status", {
        body: { transactionId },
      });
      if (error) throw error;
      if (data?.status === "completed") {
        completedRef.current = true;
        setStatus("completed");
        setTimeout(onComplete, 2000);
      } else if (data?.status === "failed") {
        completedRef.current = true;
        setStatus("failed");
        setErrorMessage(data?.error || "Payment was declined");
      } else {
        toast.info("Payment is still being processed");
      }
    } catch (err: any) {
      toast.error("Could not check payment status");
    } finally {
      setIsChecking(false);
    }
  };

  // Check when returning from background
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") checkStatus();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId]);

  return (
    <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
      <div className="bg-primary text-primary-foreground p-6 text-center">
        <img src={maragaLogo} alt="Maraga '27" className="h-10 mx-auto mb-3" />
        <h2 className="text-xl font-heading font-bold">Kopo Kopo M-Pesa</h2>
        <p className="text-primary-foreground/80 text-sm mt-1">
          {currency} {amount}
        </p>
      </div>

      <div className="p-6 space-y-6">
        {status === "sending" && (
          <div className="text-center py-8 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-lg font-medium">Sending payment request...</p>
            <p className="text-sm text-muted-foreground">
              An M-Pesa prompt will appear on <strong>{phone}</strong>
            </p>
          </div>
        )}

        {status === "waiting" && (
          <div className="text-center py-8 space-y-4">
            <Smartphone className="w-16 h-16 text-primary mx-auto" />
            <p className="text-lg font-medium">Check your phone</p>
            <p className="text-sm text-muted-foreground">
              Enter your M-Pesa PIN on <strong>{phone}</strong>
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono">
                {countdown > 0 ? `${countdown}s` : "Auto redirecting..."}
              </span>
            </div>
            <Button variant="outline" onClick={checkStatus} disabled={isChecking} className="mt-2">
              {isChecking ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Check Payment Status
            </Button>
          </div>
        )}

        {status === "completed" && (
          <div className="text-center py-8 space-y-4">
            <CheckCircle className="w-16 h-16 text-primary mx-auto" />
            <p className="text-lg font-bold">Payment Successful!</p>
          </div>
        )}

        {status === "failed" && (
          <div className="text-center py-8 space-y-4">
            <XCircle className="w-16 h-16 text-destructive mx-auto" />
            <p className="text-lg font-bold">Payment Failed</p>
            <p className="text-sm text-muted-foreground">
              {errorMessage || "An unknown error occurred"}
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={initiate} className="w-full">
                <Smartphone className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              {onFallbackStripe && (
                <Button variant="secondary" onClick={onFallbackStripe} className="w-full">
                  Pay with Card (Stripe)
                </Button>
              )}
              <Button variant="outline" onClick={onFallbackManual} className="w-full">
                Pay Manually via Paybill
              </Button>
            </div>
          </div>
        )}

        {(status === "idle" || status === "failed") && (
          <button
            onClick={onBack}
            className="w-full py-3 text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}
      </div>
    </div>
  );
};

export default KopoKopoPaymentForm;
