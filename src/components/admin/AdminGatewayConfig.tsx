import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Eye, EyeOff, Copy, CheckCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Setting {
  id: string;
  key: string;
  value: string | null;
  is_secret: boolean;
}

// Keys for each gateway
const pesaFluxKeys = ["pesaflux_api_key", "pesaflux_email"];
const kopoKopoKeys = [
  "kopokopo_api_key",
  "kopokopo_client_id",
  "kopokopo_client_secret",
  "kopokopo_till_number", // adjust if you use a different field name
];

const AdminGatewayConfig = () => {
  const [activeTab, setActiveTab] = useState<"pesaflux" | "kopokopo">("pesaflux");
  const [settings, setSettings] = useState<Setting[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const allKeys = [...pesaFluxKeys, ...kopoKopoKeys];

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .in("key", allKeys);

      if (error) {
        toast.error("Failed to load settings");
        console.error(error);
      } else {
        setSettings(data || []);
        const valueMap: Record<string, string> = {};
        data?.forEach((s) => {
          valueMap[s.key] = s.value || "";
        });
        // Fill missing keys with empty strings so the form shows them
        allKeys.forEach((key) => {
          if (!(key in valueMap)) valueMap[key] = "";
        });
        setValues(valueMap);
      }
      setIsLoading(false);
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const keysForTab = activeTab === "pesaflux" ? pesaFluxKeys : kopoKopoKeys;

      for (const key of keysForTab) {
        const setting = settings.find((s) => s.key === key);
        const newValue = values[key] || "";

        if (!setting) {
          // Insert new setting row
          const { error } = await supabase.from("site_settings").insert({
            key,
            value: newValue,
            is_secret: key.includes("secret") || key.includes("api_key"),
          });
          if (error) throw error;
        } else if (setting.value !== newValue) {
          // Update existing
          const { error } = await supabase
            .from("site_settings")
            .update({ value: newValue, updated_at: new Date().toISOString() })
            .eq("key", key);
          if (error) throw error;
        }
      }

      // Refresh settings
      const { data } = await supabase
        .from("site_settings")
        .select("*")
        .in("key", allKeys);
      if (data) setSettings(data);

      toast.success(`${activeTab === "pesaflux" ? "PesaFlux" : "Kopo Kopo"} configuration saved`);
    } catch (error) {
      toast.error("Failed to save configuration");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const formatLabel = (key: string) => {
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Your actual Supabase function endpoint base
  const baseUrl = "https://ybzmjlvikftzkyshygkn.supabase.co/functions/v1";
  const pesaFluxWebhook = `${baseUrl}/pesaflux-webhook`;
  const kopoKopoWebhook = `${baseUrl}/kopokopo-webhook`;

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Webhook URL copied");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderFields = (keys: string[]) => {
    return keys.map((key) => {
      const isSecret = key.includes("secret") || key.includes("api_key");
      const currentValue = values[key] || "";

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
              placeholder={isSecret ? "••••••••••••" : `Enter ${formatLabel(key).toLowerCase()}`}
              className="font-mono"
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
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Gateway Configuration</CardTitle>
          <CardDescription>
            Manage credentials for M-Pesa payment processors. The active gateway
            selected in "M-Pesa Gateway" will be used for donations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pesaflux" | "kopokopo")}>
            <TabsList className="mb-6">
              <TabsTrigger value="pesaflux">PesaFlux</TabsTrigger>
              <TabsTrigger value="kopokopo">Kopo Kopo</TabsTrigger>
            </TabsList>

            <TabsContent value="pesaflux" className="space-y-6">
              {renderFields(pesaFluxKeys)}
              <div className="rounded-lg border bg-muted/20 p-4">
                <Label>Webhook URL (PesaFlux)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={pesaFluxWebhook} readOnly className="font-mono text-sm flex-1" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(pesaFluxWebhook)}
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <ExternalLink className="w-3 h-3 inline mr-1" />
                  Paste this URL in your PesaFlux dashboard under Webhook/Callback settings
                </p>
              </div>
            </TabsContent>

            <TabsContent value="kopokopo" className="space-y-6">
              {renderFields(kopoKopoKeys)}
              <div className="rounded-lg border bg-muted/20 p-4">
                <Label>Webhook URL (Kopo Kopo)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={kopoKopoWebhook} readOnly className="font-mono text-sm flex-1" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(kopoKopoWebhook)}
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <ExternalLink className="w-3 h-3 inline mr-1" />
                  Paste this URL in your Kopo Kopo dashboard under Webhook/Callback settings
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <Button onClick={handleSave} disabled={isSaving} className="mt-6 w-full sm:w-auto">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminGatewayConfig;
