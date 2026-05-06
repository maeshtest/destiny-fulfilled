import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Eye, EyeOff, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const AdminPesaFluxConfig = () => {
  const [apiKey, setApiKey] = useState("");
  const [email, setEmail] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["pesaflux_api_key", "pesaflux_email"]);

      if (data) {
        data.forEach((s) => {
          if (s.key === "pesaflux_api_key") setApiKey(s.value || "");
          if (s.key === "pesaflux_email") setEmail(s.value || "");
        });
      }
      setIsLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        supabase.from("site_settings").update({ value: apiKey, updated_at: new Date().toISOString() }).eq("key", "pesaflux_api_key"),
        supabase.from("site_settings").update({ value: email, updated_at: new Date().toISOString() }).eq("key", "pesaflux_email"),
      ]);
      toast.success("PesaFlux settings saved successfully");
    } catch (err) {
      toast.error("Failed to save settings");
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pesaflux-webhook`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>PesaFlux API Configuration</CardTitle>
          <CardDescription>
            Configure your PesaFlux credentials for M-Pesa STK Push and SMS services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pesaflux-api-key">PesaFlux API Key</Label>
            <div className="flex gap-2">
              <Input
                id="pesaflux-api-key"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your PesaFlux API key"
              />
              <Button variant="outline" size="icon" onClick={() => setShowApiKey(!showApiKey)}>
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pesaflux-email">PesaFlux Account Email</Label>
            <Input
              id="pesaflux-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Configuration
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook URL</CardTitle>
          <CardDescription>
            Set this URL as your callback/webhook in PesaFlux dashboard to receive payment confirmations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 items-center">
            <Input value={webhookUrl} readOnly className="font-mono text-sm" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(webhookUrl);
                toast.success("Webhook URL copied!");
              }}
            >
              Copy
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <ExternalLink className="w-3 h-3 inline mr-1" />
            Paste this URL in your PesaFlux dashboard under Webhook/Callback settings
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPesaFluxConfig;
