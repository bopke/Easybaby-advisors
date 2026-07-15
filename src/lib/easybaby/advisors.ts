// Model i pomocnicy listy specjalistów EasyBaby.
// Dane przechowywane są w D1 (zob. advisors-repo.ts) — ten moduł zawiera tylko
// typy, metadane (statusy, województwa) i bezstanowe helpery widoku.

import { POLAND } from "./poland-map";

export type StatusTone = "eb" | "clauwi" | "other" | "spec";

export type Region = { woj: string; miasta: string[] };

export type Advisor = {
  id: string;
  imie: string;
  nazwisko: string;
  status: string;
  zweryfikowany: boolean;
  zdjecie: string;
  regiony: Region[];
  email: string;
  telefon: string;
  www: string;
  specjalnosc: string;
  oferta: string;
  // pola administracyjne
  dataUprawnien: string;
  dataDolaczenia: string;
  dataWeryfikacji: string;
  dataUtraty: string;
};

export type WojMeta = { slug: string; name: string };

export const STATUSES = [
  "doradca easybaby", "instruktor easybaby", "edukator easybaby",
  "doradca clauwi", "doradca innej szkoły", "przyjazny specjalista", "polecany specjalista",
];

export const STATUS_META: Record<string, { tone: StatusTone }> = {
  "doradca easybaby": { tone: "eb" },
  "instruktor easybaby": { tone: "eb" },
  "edukator easybaby": { tone: "eb" },
  "doradca clauwi": { tone: "clauwi" },
  "doradca innej szkoły": { tone: "other" },
  "przyjazny specjalista": { tone: "spec" },
  "polecany specjalista": { tone: "spec" },
};

export const WOJ_META: WojMeta[] = [
  ...POLAND.regions.map((r) => ({ slug: r.slug, name: r.name })),
  { slug: "zagranica", name: "Specjaliści za granicą Polski" },
];

// Wpis allowlisty (współdzielony typ, bez efektów ubocznych — używany też po stronie serwera).
export type AllowEntry = { email: string; added: string };

// Pole `zdjecie` doradcy przechowuje klucz obiektu R2 (np. "advisors/uuid.jpg").
// Tu zamieniamy go na publiczny URL serwujący plik. Puste = brak zdjęcia (inicjały).
export function photoUrl(key: string): string {
  return key ? "/api/photo/" + key : "";
}

// ===== helpery widoku (port window.EBUtil) =====
export const EBUtil = {
  initials(a: Advisor): string {
    return (a.imie[0] || "") + (a.nazwisko[0] || "");
  },
  wojName(slug: string): string {
    const m = WOJ_META.find((w) => w.slug === slug);
    return m ? m.name : slug;
  },
  primaryCity(a: Advisor, woj?: string): string {
    return EBUtil.citiesIn(a, woj)[0] || "";
  },
  citiesIn(a: Advisor, woj?: string): string[] {
    const regs = a.regiony || [];
    if (woj) {
      const r = regs.find((x) => x.woj === woj);
      return r ? (r.miasta || []) : [];
    }
    return regs.reduce<string[]>((acc, r) => acc.concat(r.miasta || []), []);
  },
  regionsOther(a: Advisor, woj?: string): Region[] {
    return (a.regiony || []).filter((r) => r.woj !== woj);
  },
  hasWoj(a: Advisor, woj: string): boolean {
    return (a.regiony || []).some((r) => r.woj === woj);
  },
  statusTone(status: string): StatusTone {
    const m = STATUS_META[status];
    return m ? m.tone : "spec";
  },
  countByWoj(advisors: Advisor[]): Record<string, number> {
    const m: Record<string, number> = {};
    advisors.forEach((a) => {
      (a.regiony || []).forEach((r) => { m[r.woj] = (m[r.woj] || 0) + 1; });
    });
    return m;
  },
};
