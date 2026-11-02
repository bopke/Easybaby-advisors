#!/usr/bin/env node
// Generates SQL with fake advisors for the STAGING database (never production).
//
//   node scripts/seed-dummy-advisors.mjs [count] > seed.sql
//   npx wrangler d1 execute easybaby-staging-db --remote --env staging --file seed.sql
//
// Deterministic (seeded PRNG), ids prefixed "dummy-" so the data can be wiped with:
//   DELETE FROM advisors WHERE id LIKE 'dummy-%';
// Contacts use example.com / 555 numbers so nothing reaches a real person.

const COUNT = Number(process.argv[2] ?? 1000);

let s = 20261102;
const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const chance = (p) => rnd() < p;
const sample = (arr, n) => [...arr].sort(() => rnd() - 0.5).slice(0, n);

const FEMALE = ["Anna", "Maria", "Katarzyna", "Małgorzata", "Agnieszka", "Barbara", "Ewa", "Magdalena", "Joanna", "Aleksandra",
  "Monika", "Natalia", "Karolina", "Paulina", "Justyna", "Marta", "Dorota", "Beata", "Weronika", "Zuzanna", "Julia", "Izabela",
  "Patrycja", "Kinga", "Sylwia", "Emilia", "Alicja", "Olga", "Hanna", "Klaudia"];
const MALE = ["Piotr", "Tomasz", "Michał", "Paweł", "Krzysztof", "Marcin", "Jakub", "Adam", "Łukasz", "Bartosz"];
const SURNAMES = ["Nowak", "Kowalsk", "Wiśniewsk", "Wójcik", "Kowalczyk", "Kamińsk", "Lewandowsk", "Zielińsk", "Szymańsk",
  "Woźniak", "Dąbrowsk", "Kozłowsk", "Jankowsk", "Mazur", "Kwiatkowsk", "Krawczyk", "Piotrowsk", "Grabowsk", "Nowakowsk",
  "Pawłowsk", "Michalsk", "Nowicki", "Adamczyk", "Dudek", "Zając", "Wieczorek", "Jabłońsk", "Król", "Majewsk", "Olszewsk",
  "Jaworsk", "Wróbel", "Malinowsk", "Pawlak", "Witkowsk", "Walczak", "Stępień", "Górsk", "Rutkowsk", "Michalak", "Sikora",
  "Ostrowsk", "Baran", "Duda", "Szewczyk", "Tomaszewsk", "Pietrzak", "Marciniak", "Wróblewsk", "Zalewsk"];
// "-sk"/"-ck" stems get a gendered ending; the rest are invariant.
const surname = (stem, female) => (/(sk|ck)$/.test(stem) ? stem + (female ? "a" : "i") : stem.replace(/ki$/, female ? "ka" : "ki"));

const CITIES = {
  "dolnoslaskie": ["Wrocław", "Wałbrzych", "Legnica", "Jelenia Góra", "Lubin", "Głogów", "Świdnica"],
  "kujawsko-pomorskie": ["Bydgoszcz", "Toruń", "Włocławek", "Grudziądz", "Inowrocław"],
  "lodzkie": ["Łódź", "Piotrków Trybunalski", "Pabianice", "Tomaszów Mazowiecki", "Bełchatów", "Zgierz"],
  "lubelskie": ["Lublin", "Zamość", "Chełm", "Biała Podlaska", "Puławy"],
  "lubuskie": ["Zielona Góra", "Gorzów Wielkopolski", "Nowa Sól", "Żary"],
  "malopolskie": ["Kraków", "Tarnów", "Nowy Sącz", "Oświęcim", "Zakopane", "Wieliczka"],
  "mazowieckie": ["Warszawa", "Radom", "Płock", "Siedlce", "Pruszków", "Legionowo", "Otwock", "Piaseczno"],
  "opolskie": ["Opole", "Kędzierzyn-Koźle", "Nysa", "Brzeg"],
  "podkarpackie": ["Rzeszów", "Przemyśl", "Stalowa Wola", "Mielec", "Krosno"],
  "podlaskie": ["Białystok", "Suwałki", "Łomża", "Augustów"],
  "pomorskie": ["Gdańsk", "Gdynia", "Sopot", "Słupsk", "Tczew", "Wejherowo"],
  "slaskie": ["Katowice", "Częstochowa", "Sosnowiec", "Gliwice", "Zabrze", "Bielsko-Biała", "Bytom", "Tychy"],
  "swietokrzyskie": ["Kielce", "Ostrowiec Świętokrzyski", "Starachowice", "Skarżysko-Kamienna"],
  "warminsko-mazurskie": ["Olsztyn", "Elbląg", "Ełk", "Ostróda", "Giżycko"],
  "wielkopolskie": ["Poznań", "Kalisz", "Konin", "Piła", "Ostrów Wielkopolski", "Gniezno", "Leszno"],
  "zachodniopomorskie": ["Szczecin", "Koszalin", "Stargard", "Kołobrzeg", "Świnoujście"],
  "zagranica": ["Londyn", "Berlin", "Dublin", "Oslo", "Amsterdam", "Wiedeń"],
};
// Rough population weights so big voivodeships get more people.
const WOJ_WEIGHTS = { "mazowieckie": 14, "slaskie": 11, "wielkopolskie": 9, "malopolskie": 9, "dolnoslaskie": 7,
  "lodzkie": 6, "pomorskie": 6, "podkarpackie": 5, "lubelskie": 5, "kujawsko-pomorskie": 5, "zachodniopomorskie": 4,
  "warminsko-mazurskie": 3, "swietokrzyskie": 3, "podlaskie": 3, "lubuskie": 2, "opolskie": 2, "zagranica": 2 };
const WOJ_BAG = Object.entries(WOJ_WEIGHTS).flatMap(([w, n]) => Array(n).fill(w));

const STATUS_WEIGHTS = { "doradca easybaby": 30, "instruktor easybaby": 10, "edukator easybaby": 6, "doradca clauwi": 15,
  "doradca innej szkoły": 15, "przyjazny specjalista": 14, "polecany specjalista": 10 };
const STATUS_BAG = Object.entries(STATUS_WEIGHTS).flatMap(([st, n]) => Array(n).fill(st));

const SPEC = ["Noszenie w chuście", "Noszenie w nosidle ergonomicznym", "Chusty i nosidła", "Fizjoterapia niemowląt",
  "Doradztwo laktacyjne", "Położna środowiskowa", "Osteopatia dziecięca", "Terapia NDT-Bobath", "Psychologia okołoporodowa",
  "Pielęgnacja noworodka", "Noszenie wcześniaków", "Noszenie bliźniąt"];
const OFFER = ["Konsultacje indywidualne", "Wizyty domowe", "Konsultacje online", "Warsztaty grupowe", "Spotkania w gabinecie",
  "Wypożyczalnia chust", "Szkoła rodzenia", "Zajęcia dla kobiet w ciąży", "Konsultacje dla ojców"];

const d = (y0, y1) => {
  const end = Math.min(Date.UTC(y1, 11, 31), Date.now());
  const t = Date.UTC(y0, 0, 1) + rnd() * (end - Date.UTC(y0, 0, 1));
  return new Date(t).toISOString().slice(0, 10);
};
const plain = (x) => x.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/[^a-z]/g, "");
const q = (v) => "'" + String(v).replace(/'/g, "''") + "'";

const rows = [];
for (let i = 1; i <= COUNT; i++) {
  const female = chance(0.92);
  const imie = pick(female ? FEMALE : MALE);
  const nazwisko = surname(pick(SURNAMES), female);

  const nWoj = chance(0.75) ? 1 : chance(0.7) ? 2 : 3;
  const wojs = [...new Set(Array.from({ length: nWoj }, () => pick(WOJ_BAG)))];
  const regiony = wojs.map((woj) => ({ woj, miasta: sample(CITIES[woj], chance(0.6) ? 1 : 2) }));

  const statusy = [pick(STATUS_BAG)];
  if (chance(0.15)) statusy.push(pick(STATUS_BAG));
  const uniq = [...new Set(statusy)];

  const zweryfikowany = chance(0.7);
  const dataUprawnien = d(2012, 2025);
  const dataDolaczenia = d(Number(dataUprawnien.slice(0, 4)), 2026);
  const id = "dummy-" + String(i).padStart(4, "0");
  const slug = plain(imie) + "." + plain(nazwisko);

  rows.push([
    id, imie, nazwisko, uniq[0], JSON.stringify(uniq), zweryfikowany ? 1 : 0, "",
    JSON.stringify(regiony),
    `${slug}${i}@example.com`,
    chance(0.85) ? `+48 555 ${String(100 + (i % 900)).padStart(3, "0")} ${String(Math.floor(rnd() * 1000)).padStart(3, "0")}` : "",
    chance(0.4) ? `www.${slug.replace(".", "")}.example.com` : "",
    pick(SPEC),
    chance(0.85) ? sample(OFFER, 1 + Math.floor(rnd() * 3)).join(", ") : "—",
    dataUprawnien, dataDolaczenia, zweryfikowany ? d(2024, 2026) : "", chance(0.04) ? d(2025, 2026) : "",
  ]);
}

const cols = "id, imie, nazwisko, status, statusy, zweryfikowany, zdjecie, regiony, email, telefon, www, specjalnosc, oferta, dataUprawnien, dataDolaczenia, dataWeryfikacji, dataUtraty";
const out = [];
for (let i = 0; i < rows.length; i += 50) {
  out.push(`INSERT OR REPLACE INTO advisors (${cols}) VALUES\n` +
    rows.slice(i, i + 50).map((r) => "(" + r.map((v) => (typeof v === "number" ? v : q(v))).join(", ") + ")").join(",\n") + ";");
}
process.stdout.write(out.join("\n") + "\n");
