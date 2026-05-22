// API client utility with token & dynamic cookie fallback authentication
import { API_URL } from "../config/api";

// Get auth headers for API requests (Style mo na may Token guard + fallback)
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
}

// Authenticated fetch wrapper — Safe para sa cookies at token requests ninyong dalawa
export async function authFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_URL}${endpoint}`;

  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  return fetch(url, {
    ...options,
    headers,
    credentials: "include", // Sinisigurong gumagana ang httpOnly cookies ng co-worker mo
  });
}

// Get stored user data mula sa LocalStorage
export function getStoredUser(): any | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("user");
  return stored ? JSON.parse(stored) : null;
}

// 🟢 FIX FOR BUILD ERROR: Idinagdag ang getUser() na hinahanap ng page.tsx mo
export async function getUser(): Promise<any | null> {
  if (typeof window === "undefined") return null;

  try {
    // Subukan muna nating kunin ang data mula sa LocalStorage (Style mo)
    const localUser = getStoredUser();
    
    // Kung may kumpletong role at dept na sa localStorage mo, ibalik agad ito
    if (localUser && localUser.role && localUser.dept) {
      return localUser;
    }

    // Kung kulang ang data sa local storage, itanong natin sa server endpoint gamit ang token/cookies mo
    const token = localStorage.getItem("token");
    const headers = getAuthHeaders();

    const res = await fetch(`${API_URL}/api/auth/validate`, {
      headers,
      credentials: "include",
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.success ? data.user : (data.user || data);
  } catch (error) {
    console.error("Error fetching user data via apiClient:", error);
    return null;
  }
}

// Clear auth data on logout
export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  localStorage.removeItem("myTickets");
  localStorage.removeItem("ticket_draft");
}

// Validate token with server
export async function validateToken(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const token = localStorage.getItem("token");
  
  try {
    const res = await fetch(`${API_URL}/api/auth/validate`, {
      headers: getAuthHeaders(),
      credentials: "include",
    });

    if (!res.ok) {
      clearAuth();
      return false;
    }

    return true;
  } catch (error) {
    console.error("Token validation error:", error);
    return false;
  }
}

// Store auth data after login
export function storeAuth(userData: any): void {
  if (typeof window === "undefined") return;
  
  // Imememorya natin ang buong object kasama ang mga dinalang role at dept fields mo
  localStorage.setItem("user", JSON.stringify(userData));
  if (userData.token) {
    localStorage.setItem("token", userData.token);
  }
}