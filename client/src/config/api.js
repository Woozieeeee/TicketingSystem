// config/api.js

// Gamitin ang original IP address logic para iwas sa IPv6 resolution bugs
export const API_URL = 
  process.env.NEXT_PUBLIC_API_URL || "http://10.38.52.2:3001";

// Idagdag lang natin ito para sa chat system features
export const APP_NAME = "My Ticketing System";
export const SOCKET_URL = API_URL;