import type { NextConfig } from "next";

// Voivodeship slugs (src/lib/easybaby/poland-map.ts) plus "zagranica"; the list
// that once sat at the site root. Fixed set, so it is spelled out here.
const WOJ_SLUGS = [
  "dolnoslaskie", "kujawsko-pomorskie", "lodzkie", "lubelskie", "lubuskie", "malopolskie",
  "mazowieckie", "opolskie", "podkarpackie", "podlaskie", "pomorskie", "slaskie",
  "swietokrzyskie", "warminsko-mazurskie", "wielkopolskie", "zachodniopomorskie", "zagranica",
];

const nextConfig: NextConfig = {
  // The dev-mode indicator badge has a known bug where it can intermittently
  // capture all pointer events across the page (clicks/hover stop working,
  // scroll still does) until dismissed — disabling it avoids that entirely.
  // Build/runtime errors still surface even with this off.
  devIndicators: false,
  async redirects() {
    return [
      // No front page yet — send / to the specialist directory for now.
      // Temporary (307) so browsers don't cache it once the front page exists.
      { source: "/", destination: "/specjalisci", permanent: false },
      // The directory used to live at /<woj>; keep old links and search results working.
      {
        source: `/:woj(${WOJ_SLUGS.join("|")})`,
        destination: "/specjalisci/:woj",
        permanent: true,
      },
    ];
  },
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
