import { getWojCounts } from "@/lib/easybaby/advisors-repo";
import { HeroBand } from "@/components/easybaby/ui";
import { MapView } from "@/components/easybaby/map";

// Liczniki czytane z D1 per-request.
export const dynamic = "force-dynamic";

const HERO = {
  title: "Specjaliści na mapie Polski",
  sub: "Wybierz swoje województwo na mapie lub z listy obok, aby zobaczyć aktywnych specjalistów działających w Twojej okolicy.",
};

export default async function MapPage() {
  const counts = await getWojCounts();
  return (
    <>
      <HeroBand title={HERO.title} subtitle={HERO.sub} />
      <MapView counts={counts} mapStyle="outline" showCounts />
    </>
  );
}
