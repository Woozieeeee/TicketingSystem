// Multiple network configurations - add your network IPs here
const NETWORKS = {
  home: "http://192.168.1.10:3001",        // Your home WiFi IP
  office: "http://10.38.52.2:3001",          // Current office network
  localhost: "http://127.0.0.1:3001",       // Local development
  // Add more networks as needed:
  // school: "http://192.168.0.50:3001",
  // coffee_shop: "http://192.168.43.100:3001",
};

// Option 1: Auto-detect based on current URL (recommended)
// This uses the same IP as where the frontend is hosted
const getAutoDetectedURL = () => {
  if (typeof window !== "undefined") {
    // Extract IP from current browser URL
    // If accessing via 192.168.x.x, it will use that
    // If accessing via 10.38.x.x, it will use that
    const currentHost = window.location.hostname;
    if (currentHost && currentHost !== "localhost") {
      return `http://${currentHost}:3001`;
    }
  }
  return null;
};

// Option 2: Try multiple IPs and use the first working one
const findWorkingServer = async () => {
  const urls = Object.values(NETWORKS);

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

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

// Option 3: Environment variable override (for production)
const getEnvURL = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return null;
};

// Get the API URL - priority: env > auto-detect > fallback
const getAPI_URL = () => {
  // Priority 1: Environment variable
  const envURL = getEnvURL();
  if (envURL) return envURL;

  // Priority 2: Auto-detected from current location
  const autoURL = getAutoDetectedURL();
  if (autoURL) return autoURL;

  // Priority 3: Default fallback
  return NETWORKS.office || "http://127.0.0.1:3001";
};

export const API_URL = getAPI_URL();

// Export for manual switching if needed
export { NETWORKS, findWorkingServer };

