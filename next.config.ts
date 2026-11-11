import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dynamic rendering is used across the store (cart, session, admin), so the
  // Cache Components model stays disabled.
  cacheComponents: false,
  images: {
    // Product artwork in this demo is generated SVG, so it needs to be allowed.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
