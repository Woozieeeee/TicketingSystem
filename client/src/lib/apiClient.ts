// API client utility with cookie-based authentication
import { API_URL } from "../config/api";

// Get default headers for API requests (no token needed — cookie is sent automatically)
export function getAuthHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
  };
}

// Authenticated fetch wrapper — sends httpOnly cookie automatically
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
    credentials: "include",
  });
}

// Get stored username only (sensitive data is in httpOnly cookies)
export function getStoredUser(): any | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("user");
  return stored ? JSON.parse(stored) : null;
}

// Get full user data from server (reads from httpOnly cookies)
export async function getUser(): Promise<any | null> {
  if (typeof window === "undefined") return null;

  try {
    const res = await fetch(`${API_URL}/api/auth/validate`, {
      credentials: "include",
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.success ? data.user : null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

// Clear auth data on logout
export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("user");
  localStorage.removeItem("myTickets");
  localStorage.removeItem("ticket_draft");
}

// Validate token with server (using cookie)
export async function validateToken(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const res = await fetch(`${API_URL}/api/auth/validate`, {
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

// Store auth data after login (only username — sensitive data is in httpOnly cookies)
export function storeAuth(userData: any): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("user", JSON.stringify({ username: userData.username }));
}
