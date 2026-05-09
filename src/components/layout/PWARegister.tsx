"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    const canRegister =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost";

    if (!("serviceWorker" in navigator) || !canRegister) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Installation still works with the manifest; ignore registration failures.
    });
  }, []);

  return null;
}
