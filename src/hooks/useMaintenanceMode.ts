import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useMaintenanceMode() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Use a timeout to prevent blocking the app if the query is slow
    const timeout = setTimeout(() => {
      if (!cancelled && isLoading) {
        setIsLoading(false); // Unblock after 3s even if query hasn't returned
      }
    }, 3000);

    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setIsMaintenanceMode(data?.value === "true");
          setIsLoading(false);
        }
      });

    const channel = supabase
      .channel("maintenance-mode")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings", filter: "key=eq.maintenance_mode" },
        (payload: any) => {
          setIsMaintenanceMode(payload.new?.value === "true");
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, []);

  return { isMaintenanceMode, isLoading };
}
