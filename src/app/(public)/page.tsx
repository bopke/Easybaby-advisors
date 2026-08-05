import { getWojCounts } from "@/lib/easybaby/advisors-repo";
import { HeroBand } from "@/components/easybaby/ui";
import { AccordionItem } from "@/components/easybaby/Accordion";
import { MapView } from "@/components/easybaby/map";

// Liczniki czytane z D1 per-request.
export const dynamic = "force-dynamic";

const HERO = {
  title: "Specjaliści przyjaźni chustonoszeniu",
  sub: `Znajdź specjalistę, który najlepiej odpowiada Twoim potrzebom.

Dla Twojej wygody przygotowaliśmy bazę specjalistów podzieloną na województwa. Dzięki wyszukiwarce szybko znajdziesz osobę, która może Cię wesprzeć – doradcę noszenia, instruktora, fizjoterapeutę, położną, neurologopedę, psychologa… a czasem nawet specjalistę, który łączy kilka z tych kompetencji.`,
};

const FAQ_ITEMS = [
  {
    question: "Kim jest „Przyjazny Specjalista”?",
    answer:
      "To osoba, która ukończyła z powodzeniem pierwszą część kursu „Wstęp do chustonoszenia” EasyBaby. Nie prowadzi nauki wiązania chust, ale rozumie ich działanie, zna podstawowe zasady bezpiecznego noszenia i potrafi uwzględnić je w swojej codziennej pracy z rodzinami.",
  },
  {
    question: "Kim jest „Polecany Specjalista”?",
    answer:
      "To specjalista polecony przez rodziców, którzy korzystali z jego wsparcia i chcą podzielić się swoim dobrym doświadczeniem. Na liście mogą znaleźć się między innymi pediatrzy, ortopedzi, fizjoterapeuci, osteopaci, położne, neurologopedzi czy psychologowie.",
  },
];

const OUTRO = `Przy każdym specjaliście znajdziesz podstawowe informacje oraz dowiesz się, kto polecił tę osobę.

Masz specjalistę, którego warto polecić innym rodzicom? Koniecznie do nas napisz! Dzięki temu baza będzie stale rosła i pomoże kolejnym rodzinom trafić do osób, które naprawdę wspierają.`;

const VERIFICATION_FAQ = {
  question: "Co oznacza znaczek ✔?",
  answer:
    "Znaczek ✔ przy nazwisku oznacza, że specjalista został zweryfikowany przez EasyBaby. Oznacza to, że Izabela Banach osobiście sprawdziła jego kompetencje związane z chustonoszeniem i potwierdziła, że wiedza tej osoby jest zgodna ze standardami EasyBaby.",
};

export default async function MapPage() {
  const counts = await getWojCounts();
  return (
    <>
      <HeroBand title={HERO.title} subtitle={HERO.sub}>
        <div className="eb-hero__accordions">
          {FAQ_ITEMS.map((item) => (
            <AccordionItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
        {OUTRO.split(/\n\s*\n/).map((p, i) => (
          <p key={i} className="eb-hero__sub">{p}</p>
        ))}
        <div className="eb-hero__accordions">
          <AccordionItem question={VERIFICATION_FAQ.question} answer={VERIFICATION_FAQ.answer} />
        </div>
      </HeroBand>
      <MapView counts={counts} mapStyle="outline" showCounts />
    </>
  );
}
