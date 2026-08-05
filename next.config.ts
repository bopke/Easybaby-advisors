import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev-mode indicator badge has a known bug where it can intermittently
  // capture all pointer events across the page (clicks/hover stop working,
  // scroll still does) until dismissed — disabling it avoids that entirely.
  // Build/runtime errors still surface even with this off.
  devIndicators: false,
  experimental: {
    // Advisor photo uploads pass through a Server Action; raise the 1MB default.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;

// Enables Cloudflare bindings (D1, KV, R2, etc.) during `next dev` so that
// getCloudflareContext() works locally. Has no effect on production builds.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
