import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Upload, CheckCircle, Loader2, ArrowLeft, Copy } from "lucide-react";
import { toast } from "sonner";
import maragaLogo from "@/assets/maraga-logo.png";

interface ManualPaymentFormProps {
  donationId: string;
  amount: string;
  currency: string;
  onComplete: () => void;
  onBack: () => void;
}

interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch: string;
  swiftCode?: string;
  instructions: string;
}

const ManualPaymentForm = ({ donationId, amount, currency, onComplete, onBack }: ManualPaymentFormProps) => {
  const [verificationType, setVerificationType] = useState<"transaction_code" | "screenshot">("transaction_code");
  const [transactionCode, setTransactionCode] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankInfo, setBankInfo] = useState<BankInfo>({
    bankName: "Standard Chartered Bank",
    accountNumber: "0100455663100",
    accountName: "Maraga Campaign 2027",
    branch: "Kenyatta Avenue, Nairobi",
    swiftCode: "SCBLKENX",
    instructions: "Please include your name as the payment reference.",
  });

  useEffect(() => {
    const fetchBankInfo = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", [
          "bank_name",
          "bank_account",
          "bank_account_name",
          "bank_branch",
          "bank_swift",
          "bank_instructions"
        ]);

      if (data) {
        const settings: Record<string, string> = {};
        data.forEach((s) => { settings[s.key] = s.value || ""; });
        setBankInfo({
          bankName: settings.bank_name || bankInfo.bankName,
          accountNumber: settings.bank_account || bankInfo.accountNumber,
          accountName: settings.bank_account_name || bankInfo.accountName,
          branch: settings.bank_branch || bankInfo.branch,
          swiftCode: settings.bank_swift || bankInfo.swiftCode,
          instructions: settings.bank_instructions || bankInfo.instructions,
        });
      }
    };
    fetchBankInfo();
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const handleSubmit = async () => {
    if (verificationType === "transaction_code" && !transactionCode.trim()) {
      toast.error("Please enter your bank transaction reference");
      return;
    }
    if (verificationType === "screenshot" && !screenshotFile) {
      toast.error("Please upload a payment screenshot");
      return;
    }

    setIsSubmitting(true);

    try {
      let screenshotUrl = null;

      if (verificationType === "screenshot" && screenshotFile) {
        const fileExt = screenshotFile.name.split(".").pop();
        const filePath = `${donationId}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("payment-screenshots")
          .upload(filePath, screenshotFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("payment-screenshots")
          .getPublicUrl(filePath);

        screenshotUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("donations")
        .update({
          verification_type: verificationType,
          transaction_code: verificationType === "transaction_code" ? transactionCode.trim().toUpperCase() : null,
          screenshot_url: screenshotUrl,
          status: "pending_verification",
        })
        .eq("id", donationId);

      if (error) throw error;

      toast.success("Payment details submitted! We'll verify your donation shortly.");
      onComplete();
    } catch (error) {
      console.error("Error submitting verification:", error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 text-center">
        <img src={maragaLogo} alt="Maraga '27" className="h-10 mx-auto mb-3" />
        <h2 className="text-xl font-heading font-bold">Complete Your Donation</h2>
        <p className="text-primary-foreground/80 text-sm mt-1">
          {currency} {amount} via Bank Transfer
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Bank Details */}
        <div className="bg-secondary rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-foreground">Bank Transfer Instructions</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Bank:</span>
              <span className="font-medium text-foreground">{bankInfo.bankName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Account Name:</span>
              <span className="font-medium text-foreground">{bankInfo.accountName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Account Number:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{bankInfo.accountNumber}</span>
                <button onClick={() => copyToClipboard(bankInfo.accountNumber, "Account number")} className="text-primary hover:text-primary/80">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {bankInfo.branch && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Branch:</span>
                <span className="font-medium text-foreground">{bankInfo.branch}</span>
              </div>
            )}
            {bankInfo.swiftCode && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">SWIFT Code:</span>
                <span className="font-medium text-foreground">{bankInfo.swiftCode}</span>
              </div>
            )}
            {bankInfo.instructions && (
              <p className="text-xs text-muted-foreground mt-2 italic">{bankInfo.instructions}</p>
            )}
          </div>
        </div>

        {/* Verification Method Toggle */}
        <div>
          <Label className="mb-3 block font-medium">How would you like to verify?</Label>
          <div className="flex rounded-lg overflow-hidden border border-border">
            <button
              type="button"
              onClick={() => setVerificationType("transaction_code")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                verificationType === "transaction_code"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              Transaction Reference
            </button>
            <button
              type="button"
              onClick={() => setVerificationType("screenshot")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                verificationType === "screenshot"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              Upload Receipt
            </button>
          </div>
        </div>

        {/* Transaction Code Input */}
        {verificationType === "transaction_code" && (
          <div className="space-y-2">
            <Label htmlFor="txRef">Bank Transaction Reference</Label>
            <Input
              id="txRef"
              value={transactionCode}
              onChange={(e) => setTransactionCode(e.target.value.toUpperCase())}
              placeholder="e.g. REF123456789"
              className="uppercase tracking-wider font-mono text-lg"
              maxLength={30}
            />
            <p className="text-xs text-muted-foreground">
              Enter the reference number from your bank transfer confirmation
            </p>
          </div>
        )}

        {/* Screenshot Upload */}
        {verificationType === "screenshot" && (
          <div className="space-y-2">
            <Label>Bank Transfer Receipt</Label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 transition-colors">
              {screenshotFile ? (
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">{screenshotFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">Click to change</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload screenshot</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && file.size > 5 * 1024 * 1024) {
                    toast.error("File must be under 5MB");
                    return;
                  }
                  setScreenshotFile(file || null);
                }}
              />
            </label>
          </div>
        )}

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          size="lg"
          className="w-full btn-donate-gradient rounded-lg py-6 text-lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Payment Verification"
          )}
        </Button>

        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
    </div>
  );
};

export default ManualPaymentForm;
