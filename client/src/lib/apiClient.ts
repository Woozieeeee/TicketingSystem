// API client utility with token authentication
import { API_URL } from "../config/api";

// Get auth headers for API requests
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

// Authenticated fetch wrapper
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
  });
}

// Get stored user data
export function getStoredUser(): any | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("user");
  return stored ? JSON.parse(stored) : null;
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
  if (!token) return false;

  try {
    const res = await fetch(`${API_URL}/api/auth/validate`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      // Token is invalid or expired
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
  localStorage.setItem("user", JSON.stringify(userData));
  if (userData.token) {
    localStorage.setItem("token", userData.token);
  }
}
