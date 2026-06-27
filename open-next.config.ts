import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Add an incremental cache override (e.g. r2IncrementalCache) here once you
  // need ISR/SSG caching across instances. Defaults are fine to start.
});
