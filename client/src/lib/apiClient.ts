// API client utility with token & dynamic cookie fallback authentication
import { API_URL } from "../config/api";

// Get auth headers for API requests (cookies are used instead of tokens)
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Token is now stored in HttpOnly cookie, no need for Authorization header
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

    // Kung kulang ang data sa local storage, itanong natin sa server endpoint gamit ang cookies
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
}

// Validate token with server (using HttpOnly cookie)
export async function validateToken(): Promise<boolean> {
  if (typeof window === "undefined") return false;

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

// Store auth data after login (user data only, token is in HttpOnly cookie)
export function storeAuth(userData: any): void {
  if (typeof window === "undefined") return;
  
  // Store user data only (token is now in HttpOnly cookie)
  localStorage.setItem("user", JSON.stringify(userData));
}