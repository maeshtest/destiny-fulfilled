import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DonationForm from "@/components/donate/DonationForm";
import DonationStats from "@/components/donate/DonationStats";
import PaymentMethodSelection from "@/components/donate/PaymentMethodSelection";
import ManualPaymentForm from "@/components/donate/ManualPaymentForm";
import StkPaymentForm from "@/components/donate/StkPaymentForm";
import KopoKopoPaymentForm from "@/components/donate/KopoKopoPaymentForm";
import ThankYouDonation from "@/components/ThankYouDonation";
import { Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type DonateStep = "form" | "payment-selection" | "stk-payment" | "kopokopo-payment" | "manual-payment" | "thank-you";

interface DonationFormData {
  name: string;
  phone: string;
  email: string;
  message: string;
  showInfo: boolean;
  currency: string;
  frequency: string;
  mpesaProvider: "pesaflux" | "kopokopo";
}

const Donate = () => {
  const [step, setStep] = useState<DonateStep>("form");
  const [donationAmount, setDonationAmount] = useState<string>("1,000");
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "stripe">("mpesa");
  const [formData, setFormData] = useState<DonationFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentDonationId, setCurrentDonationId] = useState<string | null>(null);

  const saveDonation = async (
    currentFormData: DonationFormData,
    currentAmount: string,
    currentMethod: "mpesa" | "stripe",
    status: string = "pending",
    retries = 2
  ): Promise<any> => {
    const numericAmount = parseFloat(currentAmount.replace(/,/g, ""));
    try {
      const { data, error } = await supabase
        .from("donations")
        .insert({
          name: currentFormData.showInfo ? (currentFormData.name || null) : null,
          email: currentFormData.email || null,
          phone: currentFormData.phone || null,
          amount: numericAmount,
          currency: currentFormData.currency,
          payment_method: currentMethod,
          payment_provider: currentMethod === "mpesa" ? currentFormData.mpesaProvider : "stripe",
          frequency: currentFormData.frequency,
          message: currentFormData.message || null,
          show_info: currentFormData.showInfo,
          status,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 1000));
        return saveDonation(currentFormData, currentAmount, currentMethod, status, retries - 1);
      }
      console.error("Error saving donation:", err);
      toast.error("Failed to save donation. Please try again.");
      return null;
    }
  };

  const handleFormSubmit = async (
    amount: string,
    method: "mpesa" | "stripe",
    data: DonationFormData
  ) => {
    if (isSubmitting) return; // Prevent double-submit
    setDonationAmount(amount);
    setPaymentMethod(method);
    setFormData(data);

    if (method === "stripe") {
      setStep("payment-selection");
    } else {
      setIsSubmitting(true);
      const donation = await saveDonation(data, amount, method);
      if (donation) {
        setCurrentDonationId(donation.id);
        setStep(data.mpesaProvider === "kopokopo" ? "kopokopo-payment" : "stk-payment");
      }
      setIsSubmitting(false);
    }
  };

  const handlePaymentSelect = async (provider: "stripe" | "paypal") => {
    if (isSubmitting || !formData) return; // Prevent double-submit
    setIsSubmitting(true);
    setPaymentMethod("stripe");
    const donation = await saveDonation(formData, donationAmount, "stripe");
    if (!donation) { setIsSubmitting(false); return; }

    const numericAmount = parseFloat(donationAmount.replace(/,/g, ""));
    const baseUrl = window.location.origin;

    try {
      if (provider === "stripe") {
        const { data, error } = await supabase.functions.invoke("stripe-checkout", {
          body: {
            donationId: donation.id, amount: numericAmount, currency: formData.currency,
            email: formData.email, successUrl: `${baseUrl}/donate?success=true`, cancelUrl: `${baseUrl}/donate`,
          },
        });
        if (error || !data?.url) throw new Error(data?.error || "Failed to create checkout session");
        window.location.href = data.url;
      } else {
        const { data, error } = await supabase.functions.invoke("paypal-order", {
          body: {
            donationId: donation.id, amount: numericAmount, currency: formData.currency,
            returnUrl: `${baseUrl}/donate?success=true`, cancelUrl: `${baseUrl}/donate`,
          },
        });
        if (error || !data?.approvalUrl) throw new Error(data?.error || "Failed to create PayPal order");
        window.location.href = data.approvalUrl;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Payment initialization failed";
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  if (step === "thank-you") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main><ThankYouDonation /></main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-12 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-[400px_1fr] gap-8 max-w-6xl mx-auto">
            <div className="hidden lg:block"><DonationStats /></div>
            <div>
              {step === "form" && <DonationForm onSubmit={handleFormSubmit} />}

              {step === "stk-payment" && currentDonationId && formData && (
                <StkPaymentForm
                  donationId={currentDonationId}
                  amount={donationAmount}
                  phone={formData.phone}
                  currency={formData.currency}
                  onComplete={() => setStep("thank-you")}
                  onBack={() => setStep("form")}
                  onFallbackManual={() => setStep("manual-payment")}
                />
              )}

              {step === "kopokopo-payment" && currentDonationId && formData && (
                <KopoKopoPaymentForm
                  donationId={currentDonationId}
                  amount={donationAmount}
                  phone={formData.phone}
                  currency={formData.currency}
                  name={formData.name}
                  email={formData.email}
                  onComplete={() => setStep("thank-you")}
                  onBack={() => setStep("form")}
                  onFallbackManual={() => setStep("manual-payment")}
                  onFallbackStripe={() => handlePaymentSelect("stripe")}
                />
              )}

              {step === "manual-payment" && currentDonationId && formData && (
                <ManualPaymentForm
                  donationId={currentDonationId}
                  amount={donationAmount}
                  currency={formData.currency}
                  onComplete={() => setStep("thank-you")}
                  onBack={() => setStep("form")}
                />
              )}

              {step === "payment-selection" && formData && (
                <PaymentMethodSelection
                  amount={donationAmount}
                  currency={formData.currency}
                  email={formData.email}
                  onSelectStripe={() => handlePaymentSelect("stripe")}
                  onSelectPayPal={() => handlePaymentSelect("paypal")}
                  onBack={() => setStep("form")}
                  isLoading={isSubmitting}
                />
              )}

              <div className="text-center text-sm text-muted-foreground mt-6">
                <p className="flex items-center justify-center gap-1">
                  <Shield className="w-4 h-4 text-primary" />
                  You're donating to the Maraga Campaign. Transactions processed securely.
                </p>
                <p className="mt-2">
                  Questions? <a href="mailto:donations@davidmaraga.com" className="text-primary underline">donations@davidmaraga.co</a>
                  {" • "}
                  <a href="#" className="text-primary underline">Privacy</a>
                </p>
              </div>
            </div>
          </div>
          <div className="lg:hidden mt-8"><DonationStats /></div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Donate;
