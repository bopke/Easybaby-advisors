import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
