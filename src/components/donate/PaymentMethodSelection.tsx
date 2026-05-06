import { CreditCard, ArrowLeft, Loader2 } from "lucide-react";
import maragaLogo from "@/assets/maraga-logo.png";

interface PaymentMethodSelectionProps {
  amount: string;
  currency: string;
  email: string;
  onSelectStripe: () => void;
  onSelectPayPal: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

const PaymentMethodSelection = ({ 
  amount, 
  currency,
  email, 
  onSelectStripe, 
  onSelectPayPal, 
  onBack,
  isLoading = false
}: PaymentMethodSelectionProps) => {
  const currencySymbol = currency === "KES" ? "KES " : "$";
  
  return (
    <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
      {/* Header */}
      <div className="text-center p-6 md:p-8 border-b border-border">
        <div className="flex justify-center mb-4">
          <img src={maragaLogo} alt="Maraga '27" className="h-12" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-primary mb-2">
          Choose Payment Method
        </h2>
        <p className="text-muted-foreground">
          Complete your donation securely
        </p>
      </div>

      {/* Donation Summary */}
      <div className="p-6">
        <div className="bg-secondary rounded-xl p-6 mb-6 text-center">
          <p className="text-3xl font-bold text-primary mb-1">{currencySymbol}{amount}</p>
          <p className="text-muted-foreground">One-time donation</p>
          {email && (
            <p className="text-sm text-muted-foreground mt-1">
              {email}
            </p>
          )}
        </div>

        {/* Payment Options */}
        <div className="space-y-4">
          <button
            onClick={onSelectStripe}
            disabled={isLoading}
            className="w-full gradient-stripe text-white rounded-xl p-4 flex items-center gap-4 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
            </div>
            <div className="text-left">
              <p className="font-semibold">Pay with Stripe</p>
              <p className="text-sm text-white/80">Credit Card, Debit Card, Apple Pay, Google Pay</p>
            </div>
          </button>

          <button
            onClick={onSelectPayPal}
            disabled={isLoading}
            className="w-full gradient-paypal text-white rounded-xl p-4 flex items-center gap-4 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="font-bold text-lg">P</span>}
            </div>
            <div className="text-left">
              <p className="font-semibold">Pay with PayPal</p>
              <p className="text-sm text-white/80">PayPal Balance, Bank, Credit Card</p>
            </div>
          </button>
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          disabled={isLoading}
          className="w-full mt-6 py-4 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Form
        </button>
      </div>
    </div>
  );
};

export default PaymentMethodSelection;
