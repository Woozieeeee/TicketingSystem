// config/api.js

// 1. Define NETWORKS first so it can be used by the functions below
const NETWORKS = {
  home: "http://192.168.1.10:3001",        // Your home WiFi IP
  office: "http://10.38.52.2:3001",          // Current office network
  localhost: "http://127.0.0.1:3001",       // Local development
  // Add more networks as needed:
  // school: "http://192.168.0.50:3001",
  // coffee_shop: "http://192.168.43.100:3001",
};

export const APP_NAME = "My Ticketing System";

// 2. Helper functions for detection
const getAutoDetectedURL = () => {
  if (typeof window !== "undefined") {
    const currentHost = window.location.hostname;
    if (currentHost && currentHost !== "localhost" && !currentHost.includes("127.0.0.1")) {
      return `http://${currentHost}:3001`;
    }
  }
  return null;
};

const getEnvURL = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return null;
};

const findWorkingServer = async () => {
  const urls = Object.values(NETWORKS);
  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      await fetch(`${url}/api/auth/validate`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`✅ Connected to: ${url}`);
      return url;
    } catch {
      console.log(`❌ Failed: ${url}`);
      continue;
    }
  }
  return null;
};

// 3. Final API_URL logic (Priority: Env > Auto-detect > Office Fallback)
const getFinalURL = () => {
  const envURL = getEnvURL();
  if (envURL) return envURL;

  const autoURL = getAutoDetectedURL();
  if (autoURL) return autoURL;

  return NETWORKS.office || "http://127.0.0.1:3001";
};

// 4. Final Exports
export const API_URL = getFinalURL();
export const SOCKET_URL = API_URL;

export { NETWORKS, findWorkingServer };