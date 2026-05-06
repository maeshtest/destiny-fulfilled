import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Eye, EyeOff, Save } from "lucide-react";
import { toast } from "sonner";

interface Setting {
  id: string;
  key: string;
  value: string | null;
  is_secret: boolean;
}

interface AdminSettingsProps {
  settingsFilter: "payment" | "general";
}

const paymentKeys = [
  "ncba_paybill",
  "ncba_account_number",
  "ncba_bank_name",
  "mpesa_paybill",
  "mpesa_account",
  "pesaflux_api_key",
  "pesaflux_email",
  "stripe_publishable_key",
  "stripe_secret_key",
  "paypal_client_id",
  "paypal_secret",
  "active_payment_gateway", // ← added gateway key
];

const generalKeys = [
  "site_name",
  "hero_title",
  "hero_subtitle",
  "donation_cta",
  "payment_instructions",
];

const AdminSettings = ({ settingsFilter }: AdminSettingsProps) => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const filterKeys = settingsFilter === "payment" ? paymentKeys : generalKeys;

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .in("key", filterKeys);

      if (error) {
        toast.error("Failed to load settings");
        console.error(error);
      } else {
        setSettings(data || []);
        const valueMap: Record<string, string> = {};
        data?.forEach((s) => {
          valueMap[s.key] = s.value || "";
        });
        setValues(valueMap);
      }
      setIsLoading(false);
    };

    fetchSettings();
  }, [settingsFilter]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      for (const setting of settings) {
        if (values[setting.key] !== setting.value) {
          await supabase
            .from("site_settings")
            .update({ 
              value: values[setting.key],
              updated_at: new Date().toISOString(),
            })
            .eq("key", setting.key);
        }
      }
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
      console.error(error);
    }

    setIsSaving(false);
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const formatLabel = (key: string) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Render a select dropdown for the gateway key
  const renderGatewaySelect = (key: string, currentValue: string) => (
    <Select
      value={currentValue}
      onValueChange={(val) => setValues((prev) => ({ ...prev, [key]: val }))}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select gateway" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pesaflux">PesaFlux</SelectItem>
        <SelectItem value="kopokopo">Kopo Kopo</SelectItem>
      </SelectContent>
    </Select>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {filterKeys.map((key) => {
        const setting = settings.find((s) => s.key === key);
        const isSecret = setting?.is_secret ?? false;
        const currentValue = values[key] || "";

        // Special handling for gateway selector
        if (key === "active_payment_gateway") {
          return (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{formatLabel(key)}</Label>
              {renderGatewaySelect(key, currentValue)}
            </div>
          );
        }

        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{formatLabel(key)}</Label>
            <div className="flex gap-2">
              <Input
                id={key}
                type={isSecret && !showSecrets[key] ? "password" : "text"}
                value={currentValue}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [key]: e.target.value }))
                }
                placeholder={isSecret ? "••••••••" : `Enter ${formatLabel(key).toLowerCase()}`}
              />
              {isSecret && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => toggleShowSecret(key)}
                >
                  {showSecrets[key] ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        );
      })}

      <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </>
        )}
      </Button>
    </div>
  );
};

export default AdminSettings;
