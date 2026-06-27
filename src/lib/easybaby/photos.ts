import "server-only";

// Zdjęcia specjalistów w R2. Klucz obiektu trzymany jest w polu `zdjecie`
// rekordu doradcy; serwowanie przez /api/photo/<klucz>.

import { getCloudflareContext } from "@opennextjs/cloudflare";

const PREFIX = "advisors/";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

async function bucket(): Promise<R2Bucket> {
  const { env } = await getCloudflareContext({ async: true });
  return env.PHOTOS;
}

/** Wgrywa plik do R2 i zwraca jego klucz. Waliduje typ i rozmiar. */
export async function uploadPhoto(file: File): Promise<string> {
  if (!file || file.size === 0) throw new Error("Pusty plik");
  if (file.size > MAX_BYTES) throw new Error("Plik jest za duży (max 5 MB)");
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) throw new Error("Nieobsługiwany format (dozwolone: JPG, PNG, WEBP, GIF)");

  const key = PREFIX + crypto.randomUUID() + "." + ext;
  const B = await bucket();
  await B.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  return key;
}

/** Usuwa obiekt z R2 (idempotentne). */
export async function deletePhoto(key?: string | null): Promise<void> {
  if (!key) return;
  const B = await bucket();
  await B.delete(key);
}
