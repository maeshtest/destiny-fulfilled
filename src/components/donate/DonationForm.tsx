import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Smartphone, CreditCard, Zap } from "lucide-react";
import maragaLogo from "@/assets/maraga-logo.png";
import { supabase } from "@/integrations/supabase/client";

interface DonationFormProps {
  onSubmit: (amount: string, paymentMethod: "mpesa" | "stripe", formData: {
    name: string;
    phone: string;
    email: string;
    message: string;
    showInfo: boolean;
    currency: string;
    frequency: string;
    mpesaProvider: "pesaflux" | "kopokopo";
  }) => void;
}

const DonationForm = ({ onSubmit }: DonationFormProps) => {
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "stripe">("mpesa");
  const [amount, setAmount] = useState<string>("1,000");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [showInfo, setShowInfo] = useState(false);
  const [frequency, setFrequency] = useState<"one-time" | "monthly">("one-time");
  const [currency, setCurrency] = useState<string>("KES");
  const [mpesaProvider, setMpesaProvider] = useState<"pesaflux" | "kopokopo" | null>(null);
  const [isGatewayLoading, setIsGatewayLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  // Fetch the active M‑Pesa gateway from admin settings
  useEffect(() => {
    const fetchGateway = async () => {
      try {
        // Read from site_settings (where the admin UI writes); fall back to app_settings
        const { data: site } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "active_payment_gateway")
          .maybeSingle();
        let provider = site?.value as "pesaflux" | "kopokopo" | undefined;
        if (!provider) {
          const { data: app } = await supabase
            .from("app_settings")
            .select("value")
            .eq("key", "active_payment_gateway")
            .maybeSingle();
          provider = app?.value as "pesaflux" | "kopokopo" | undefined;
        }
        setMpesaProvider(provider || "pesaflux");
      } catch (err) {
        console.error("Failed to fetch payment gateway setting:", err);
        setMpesaProvider("pesaflux"); // safe fallback
      } finally {
        setIsGatewayLoading(false);
      }
    };
    fetchGateway();
  }, []);

  // Determine color scheme based on payment method
  const isMpesa = paymentMethod === "mpesa";
  
  // Color classes based on payment method
  const colorClasses = {
    // For M-Pesa: green theme, for Stripe: purple theme (#9910FB)
    primary: isMpesa ? "bg-primary text-primary-foreground" : "bg-[#9910FB] text-white",
    primaryHover: isMpesa ? "hover:bg-primary/90" : "hover:bg-[#9910FB]/90",
    primaryBorder: isMpesa ? "border-primary" : "border-[#9910FB]",
    primaryText: isMpesa ? "text-primary" : "text-[#9910FB]",
    tabActive: isMpesa 
      ? "bg-primary text-primary-foreground" 
      : "bg-[#9910FB] text-white",
    tabInactive: isMpesa 
      ? "bg-muted text-muted-foreground hover:bg-muted/80" 
      : "bg-purple-50 text-[#9910FB] hover:bg-purple-100",
    // Updated frequency toggle - dark/black background for selected, white for unselected
    frequencyActive: "bg-black text-white",
    frequencyInactive: "bg-white text-black",
    buttonGradient: isMpesa 
      ? "btn-donate-gradient" 
      : "bg-gradient-to-r from-[#9910FB] to-[#7A0BDA] hover:from-[#7A0BDA] hover:to-[#9910FB]",
    amountSelected: isMpesa 
      ? "border-primary bg-primary text-primary-foreground" 
      : "border-[#9910FB] bg-[#9910FB] text-white",
    amountHover: isMpesa 
      ? "hover:border-primary" 
      : "hover:border-[#9910FB]",
    customAmountSelected: isMpesa 
      ? "border-primary bg-primary text-primary-foreground" 
      : "border-[#9910FB] bg-[#9910FB] text-white",
    activeTabBorder: isMpesa 
      ? "border-b-2 border-primary" 
      : "border-b-2 border-[#9910FB]",
    // Person icon colors
    personIconBg: isMpesa ? "bg-primary/10" : "bg-[#9910FB]/10",
    personIconColor: isMpesa ? "text-primary" : "text-[#9910FB]",
  };

  // Amount options based on currency
  const kesAmounts = ["50", "100", "500", "1,000", "2,000", "5,000", "10,000"];
  const usdAmounts = ["10", "25", "50", "100", "250", "500", "1000"];
  
  const amounts = currency === "USD" ? usdAmounts : kesAmounts;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = amount || customAmount;
    if (!finalAmount || parseFloat(finalAmount.replace(/,/g, "")) <= 0) {
      return;
    }
    // Phone is always required for M-Pesa
    if (paymentMethod === "mpesa" && !formData.phone.trim()) {
      return;
    }
    // Make sure we have a gateway provider
    const provider = mpesaProvider || "pesaflux";
    onSubmit(finalAmount, paymentMethod, {
      name: formData.name.trim() || "",
      phone: formData.phone.trim() || "",
      email: formData.email.trim() || "",
      message: formData.message.trim() || "",
      showInfo,
      currency,
      frequency,
      mpesaProvider: provider,
    });
  };

  // Show a brief loading state while the gateway is being fetched
  if (isGatewayLoading || !mpesaProvider) {
    return (
      <div className="bg-card rounded-2xl shadow-card border border-border p-8 text-center">
        <p className="text-muted-foreground">Loading payment options…</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
      {/* Payment Method Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => { setPaymentMethod("mpesa"); setCurrency("KES"); setAmount("1,000"); }}
          className={`flex-1 py-4 px-6 font-medium flex items-center justify-center gap-2 transition-colors ${
            paymentMethod === "mpesa" 
              ? colorClasses.tabActive
              : colorClasses.tabInactive
          }`}
        >
          <Smartphone className="w-5 h-5" />
          M-Pesa
        </button>
        <button
          onClick={() => { setPaymentMethod("stripe"); setCurrency("USD"); setAmount("100"); }}
          className={`flex-1 py-4 px-6 font-medium flex items-center justify-center gap-2 transition-colors ${
            paymentMethod === "stripe" 
              ? colorClasses.tabActive
              : colorClasses.tabInactive
          }`}
        >
          <Zap className="w-5 h-5" />
          Stripe/PayPal
        </button>
      </div>

      {/* Form Content */}
      <div className="p-6 md:p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={maragaLogo} alt="Maraga '27" className="h-12" />
        </div>

        <div className="text-center mb-8">
          <h2 className={`text-2xl font-heading font-bold ${colorClasses.primaryText} mb-2`}>
            Make your contribution with {paymentMethod === "mpesa" ? "M-Pesa" : "Stripe/PayPal"}
          </h2>
          <p className="text-muted-foreground">
            {paymentMethod === "mpesa" 
              ? "Safe, fast and secure mobile payments" 
              : "Secure payments via Stripe and PayPal"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 🚫 M-Pesa provider switcher REMOVED – now admin‑only */}

          {/* Frequency Toggle - Only for Stripe */}
          {paymentMethod === "stripe" && (
            <div className="flex rounded-lg overflow-hidden border border-border">
              <button
                type="button"
                onClick={() => setFrequency("one-time")}
                className={`flex-1 py-3 px-4 font-medium transition-colors ${
                  frequency === "one-time"
                    ? colorClasses.frequencyActive
                    : colorClasses.frequencyInactive
                }`}
              >
                One-time
              </button>
              <button
                type="button"
                onClick={() => setFrequency("monthly")}
                className={`flex-1 py-3 px-4 font-medium transition-colors ${
                  frequency === "monthly"
                    ? colorClasses.frequencyActive
                    : colorClasses.frequencyInactive
                }`}
              >
                Monthly
              </button>
            </div>
          )}

          {/* Currency Selection - Only for Stripe */}
          {paymentMethod === "stripe" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Currency
              </label>
              <Select 
                value={currency} 
                onValueChange={(value) => { 
                  setCurrency(value); 
                  setAmount(value === "USD" ? "100" : "1,000"); 
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue>
                    {currency === "USD" && (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">$</span>
                        <span>US Dollar (USD)</span>
                      </div>
                    )}
                    {currency === "EUR" && (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">€</span>
                        <span>Euro (EUR)</span>
                      </div>
                    )}
                    {currency === "GBP" && (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">£</span>
                        <span>British Pound (GBP)</span>
                      </div>
                    )}
                    {currency === "KES" && (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">KSh</span>
                        <span>Kenyan Shilling (KES)</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">$</span>
                      <span>US Dollar (USD)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="EUR">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">€</span>
                      <span>Euro (EUR)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="GBP">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">£</span>
                      <span>British Pound (GBP)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="KES">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">KSh</span>
                      <span>Kenyan Shilling (KES)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Choose Amount ({currency === "USD" || currency === "EUR" || currency === "GBP" ? "$" : "KES"})
            </label>
            <div className="grid grid-cols-4 gap-3">
              {amounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => { setAmount(amt); setCustomAmount(""); }}
                  className={`py-3 px-2 md:px-4 rounded-lg border text-sm font-medium transition-colors ${
                    amount === amt
                      ? colorClasses.amountSelected
                      : `border-border bg-card text-foreground ${colorClasses.amountHover}`
                  }`}
                >
                  {currency !== "KES" && "$"}{amt}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount("")}
                className={`py-3 px-2 md:px-4 rounded-lg border text-sm font-medium transition-colors ${
                  amount === "" && customAmount
                    ? colorClasses.customAmountSelected
                    : `border-border bg-card text-foreground ${colorClasses.amountHover}`
                }`}
              >
                Other
              </button>
            </div>
            
            {amount === "" && (
              <Input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter custom amount"
                className="mt-3"
              />
            )}
          </div>

          {/* Show My Information Toggle */}
          <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClasses.personIconBg}`}>
                <svg className={`w-4 h-4 ${colorClasses.personIconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-foreground">Show My Information</p>
                <p className="text-sm text-muted-foreground">Your name and email will be visible</p>
              </div>
            </div>
            <Switch checked={showInfo} onCheckedChange={setShowInfo} />
          </div>

          {/* Personal Info */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Your Name (optional) {showInfo && <span className="text-destructive">*</span>}
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your full name"
              required={showInfo}
            />
          </div>

          {paymentMethod === "mpesa" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone Number <span className="text-destructive">*</span>
              </label>
              <div className="flex gap-2">
                <Select defaultValue="+254">
                  <SelectTrigger className="w-32">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <span>🇰🇪</span>
                        <span className="text-xs">+254</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+254">
                      <div className="flex items-center gap-2">
                        <span>🇰🇪</span>
                        <span className="text-xs">+254</span>
                        <span className="text-xs text-muted-foreground">Kenya</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="+255">
                      <div className="flex items-center gap-2">
                        <span>🇹🇿</span>
                        <span className="text-xs">+255</span>
                        <span className="text-xs text-muted-foreground">Tanzania</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="+256">
                      <div className="flex items-center gap-2">
                        <span>🇺🇬</span>
                        <span className="text-xs">+256</span>
                        <span className="text-xs text-muted-foreground">Uganda</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="+250">
                      <div className="flex items-center gap-2">
                        <span>🇷🇼</span>
                        <span className="text-xs">+250</span>
                        <span className="text-xs text-muted-foreground">Rwanda</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="+257">
                      <div className="flex items-center gap-2">
                        <span>🇧🇮</span>
                        <span className="text-xs">+257</span>
                        <span className="text-xs text-muted-foreground">Burundi</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="+258">
                      <div className="flex items-center gap-2">
                        <span>🇲🇿</span>
                        <span className="text-xs">+258</span>
                        <span className="text-xs text-muted-foreground">Mozambique</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="+27">
                      <div className="flex items-center gap-2">
                        <span>🇿🇦</span>
                        <span className="text-xs">+27</span>
                        <span className="text-xs text-muted-foreground">South Africa</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="+260">
                      <div className="flex items-center gap-2">
                        <span>🇿🇲</span>
                        <span className="text-xs">+260</span>
                        <span className="text-xs text-muted-foreground">Zambia</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="712345678"
                  className="flex-1"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Enter your mobile money number (without country code)
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email Address (optional)
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Optional Message
            </label>
            <Textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Leave a message of support..."
              rows={3}
            />
          </div>

          {/* Submit */}
          <Button 
            type="submit" 
            size="lg" 
            className={`w-full ${colorClasses.buttonGradient} rounded-lg py-6 text-lg`}
          >
            {paymentMethod === "stripe" ? "Continue to Payment" : "Donate Now"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default DonationForm;
