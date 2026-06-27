import { getCloudflareContext } from "@opennextjs/cloudflare";

// Publiczne serwowanie zdjęć specjalistów z R2: /api/photo/<klucz>.
export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const key = (path || []).join("/");
  if (!key) return new Response("Not found", { status: 404 });

  const { env } = await getCloudflareContext({ async: true });
  const obj = await env.PHOTOS.get(key);
  if (!obj) return new Response("Not found", { status: 404 });

  // Buforujemy do ArrayBuffer (zdjęcia są małe) — unika problemów ze
  // strumieniem R2 w dev i działa tak samo w produkcji.
  // Uwaga: nie używamy writeHttpMetadata() — w dev obiekt R2 jest proxy, a
  // przekazanie do niego obiektu Headers nie serializuje się przez most.
  const buf = await obj.arrayBuffer();
  const headers = new Headers();
  headers.set("content-type", obj.httpMetadata?.contentType || "application/octet-stream");
  headers.set("etag", obj.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(buf, { headers });
}
