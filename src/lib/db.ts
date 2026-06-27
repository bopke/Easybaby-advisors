import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Access the D1 database binding from server code (Server Components, Route
 * Handlers, Server Actions).
 *
 * Sync form works inside a request scope:
 *   const db = getDB();
 *
 * If you need it during static/prerender (outside a request), use the async
 * Cloudflare context directly:
 *   const { env } = await getCloudflareContext({ async: true });
 */
export function getDB(): D1Database {
  return getCloudflareContext().env.DB;
}
