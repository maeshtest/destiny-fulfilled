import { useMemo } from "react";

type SubdomainType = "main" | "admin";

export function useSubdomain(): SubdomainType {
  return useMemo(() => {
    const hostname = window.location.hostname;
    
    // Check for admin subdomain patterns
    if (
      hostname.startsWith("admin.") ||
      hostname.includes("admin-preview") ||
      // For local development
      hostname === "admin.localhost"
    ) {
      return "admin";
    }
    
    // Check for query param override for development
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("admin") === "true") {
      return "admin";
    }
    
    return "main";
  }, []);
}

export function isAdminSubdomain(): boolean {
  const hostname = window.location.hostname;
  return (
    hostname.startsWith("admin.") ||
    hostname.includes("admin-preview") ||
    hostname === "admin.localhost" ||
    new URLSearchParams(window.location.search).get("admin") === "true"
  );
}
