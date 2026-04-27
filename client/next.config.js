const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enables extra checks and warnings for React best practices (e.g., double-invoking effects in dev).
  reactStrictMode: true,

  // Configuration for Turbopack (the fast bundler used by 'next dev').
  turbopack: {
    // Explicitly set the root directory for module resolution.
    // This was necessary because our project structure (client/ folder inside a root folder)
    // caused Turbopack to have trouble finding the correct project root automatically.
    root: path.join(__dirname),
  },
};

module.exports = nextConfig;
