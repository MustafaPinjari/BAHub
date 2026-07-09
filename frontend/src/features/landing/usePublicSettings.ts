import { useState, useEffect } from "react";

interface PublicSettings {
  waitlist_countdown_enabled: boolean;
  maintenance_mode: boolean;
}

export function usePublicSettings(): PublicSettings {
  const [settings, setSettings] = useState<PublicSettings>({
    waitlist_countdown_enabled: false,
    maintenance_mode: false,
  });

  useEffect(() => {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    const base = isLocal
      ? "http://127.0.0.1:8000"
      : "https://bahub-backend.onrender.com";

    fetch(`${base}/api/v1/public/settings/`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setSettings(data))
      .catch(() => {
        // Silently fail — defaults are safe (countdown off)
      });
  }, []);

  return settings;
}
