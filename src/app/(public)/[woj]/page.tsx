import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EBUtil, WOJ_META } from "@/lib/easybaby/advisors";
import { listPublicAdvisors } from "@/lib/easybaby/advisors-repo";
import { ListView } from "@/components/easybaby/list";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

function isValidWoj(woj: string): boolean {
  return WOJ_META.some((w) => w.slug === woj);
}

export async function generateMetadata({ params }: { params: Promise<{ woj: string }> }): Promise<Metadata> {
  const { woj } = await params;
  if (!isValidWoj(woj)) return { title: "Nie znaleziono — EasyBaby" };
  const name = EBUtil.wojName(woj);
  return {
    title: `Specjaliści — ${name} — EasyBaby`,
    description: `Aktywni specjaliści EasyBaby działający w regionie ${name}.`,
  };
}

export default async function WojPage({ params }: { params: Promise<{ woj: string }> }) {
  const { woj } = await params;
  if (!isValidWoj(woj)) notFound();

  // Pierwsza strona renderowana po stronie serwera — bezpośredni link działa od razu.
  const page = await listPublicAdvisors({ woj, q: "", status: "", sort: "nazwisko", offset: 0, limit: PAGE_SIZE });

  return (
    <ListView
      key={woj}
      woj={woj}
      initialItems={page.items}
      initialTotal={page.total}
      layout="lista"
      showAvatars
    />
  );
}
