import { getWojCounts } from "@/lib/easybaby/advisors-repo";
import { HeroBand } from "@/components/easybaby/ui";
import { MapView } from "@/components/easybaby/map";

// Liczniki czytane z D1 per-request.
export const dynamic = "force-dynamic";

const HERO = {
  title: "Specjaliści przyjaźni chustonoszeniu",
  sub: `Tutaj znajduje się lista specjalistów w podziale na województwa dla Twojej wygody.

W wyszukiwarce możesz znaleźć specjalistę odpowiadającego Twojej potrzebie wsparcia

Polecany specjalista to taki specjalista, który jest przyjazny chustom i poleca go pacjent, który był pod jego opieką. Ortopeda, pediatra, neurolog, fizjoterapeuta, osteopata, położna.. Znajdziesz o nim podstawowe informacje, ale też - kto go polecił. Chcesz kogoś polecić? Napisz koniecznie!

Przyjazny specjalista to taki, który ukończył z powodzeniem pierwszą część wstępu do chustonoszenia EasyBaby.

Znaczek przy nazwisku oznacza, że specjalista jest zweryfikowany przez EasyBaby, czyli Izabela osobiście sprawdziła kompetencje chustowe tej osoby.`,
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
