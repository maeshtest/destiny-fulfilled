import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Construction, Loader2 } from "lucide-react";
import { toast } from "sonner";

const AdminMaintenanceToggle = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "maintenance_mode")
        .maybeSingle();

      setIsEnabled(data?.value === "true");
      setIsLoading(false);
    };
    fetch();
  }, []);

  const handleToggle = async (checked: boolean) => {
    setIsSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .update({ value: checked ? "true" : "false", updated_at: new Date().toISOString() })
      .eq("key", "maintenance_mode");

    if (error) {
      toast.error("Failed to update maintenance mode");
    } else {
      setIsEnabled(checked);
      toast.success(checked ? "Maintenance mode enabled — site is now offline" : "Maintenance mode disabled — site is live");
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isEnabled ? "border-destructive" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 flex items-center justify-center ${isEnabled ? "bg-destructive/10" : "bg-muted"}`}>
            <Construction className={`w-5 h-5 ${isEnabled ? "text-destructive" : "text-muted-foreground"}`} />
          </div>
          <div>
            <CardTitle className="text-base">Maintenance Mode</CardTitle>
            <CardDescription>
              {isEnabled ? "Site is currently offline for visitors" : "Site is live and accessible"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Label htmlFor="maintenance-toggle" className="text-sm font-medium">
            {isEnabled ? "🔴 Maintenance ON" : "🟢 Site is Live"}
          </Label>
          <Switch
            id="maintenance-toggle"
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={isSaving}
          />
        </div>
        {isEnabled && (
          <p className="text-xs text-destructive mt-3">
            All public pages are showing a maintenance message. Admin panel remains accessible.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminMaintenanceToggle;
