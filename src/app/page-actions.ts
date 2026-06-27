"use server";

// Publiczne (bez logowania) odczyty listy specjalistów dla infinite scroll.

import { listPublicAdvisors } from "@/lib/easybaby/advisors-repo";
import type { PublicPage, PublicPageParams } from "@/lib/easybaby/advisors-repo";

export async function getAdvisorsPageAction(params: PublicPageParams): Promise<PublicPage> {
  // Twarde ograniczenie limitu — chroni przed nadużyciem publicznego endpointu.
  const limit = Math.min(Math.max(params.limit | 0, 1), 50);
  return listPublicAdvisors({ ...params, limit });
}
