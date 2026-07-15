"use client";

// Lista specjalistów dla pojedynczego województwa (własny URL /[woj]).
// Pierwsza strona przychodzi z serwera (SSR), kolejne doładowują się przy
// przewijaniu (infinite scroll); filtry/sort odpytują serwer ponownie.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EBUtil, STATUSES, WOJ_META } from "@/lib/easybaby/advisors";
import type { Advisor } from "@/lib/easybaby/advisors";
import { getAdvisorsPageAction } from "@/app/page-actions";
import { Avatar, StatusBadge } from "./ui";
import { Chevron, GreenTick, IcoMail, IcoPhone, IcoWww } from "./icons";

export type ListLayout = "lista" | "karty" | "tabela";
type Sort = "nazwisko" | "status" | "miasto";

const PAGE_SIZE = 12;

function wwwHref(w: string) {
  return /^https?:\/\//.test(w) ? w : "https://" + w;
}

// Normalizacja do dopasowań miast: małe litery, bez ogonków (ó→o, ł→l),
// żeby dopasowanie działało niezależnie od polskich znaków.
function normCity(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\u0142/g, "l");
}

// Gdy zapytanie pasuje do jednej z miejscowości specjalisty, przenieś ją na
// początek — dzięki temu w skróconym widoku pokazujemy miasto, które użytkownik
// wpisał (np. Pruszków), a nie główne z listy (np. Warszawę).
function leadCity(cities: string[], q: string): string {
  const nq = normCity(q.trim());
  if (!nq) return cities[0] ?? "";
  const hit = cities.find((c) => normCity(c).includes(nq));
  return hit ?? cities[0] ?? "";
}

// ---- bloki szczegółów ----
function CitiesChips({ cities }: { cities: string[] }) {
  return (
    <div className="eb-chips">
      {cities.map((c, i) => <span key={i} className={"eb-citychip" + (i === 0 ? " is-primary" : "")}>{c}</span>)}
    </div>
  );
}

function ContactRows({ a }: { a: Advisor }) {
  return (
    <div className="eb-contact">
      <a className="eb-contact__item" href={"mailto:" + a.email}><IcoMail /><span>{a.email}</span></a>
      <a className="eb-contact__item" href={"tel:" + a.telefon.replace(/\s/g, "")}><IcoPhone /><span>{a.telefon}</span></a>
      {a.www && <a className="eb-contact__item" href={wwwHref(a.www)} target="_blank" rel="noopener"><IcoWww /><span>{a.www}</span></a>}
    </div>
  );
}

function OtherRegions({ a, woj }: { a: Advisor; woj: string }) {
  const others = EBUtil.regionsOther(a, woj);
  if (!others.length) return null;
  return (
    <div className="eb-detail eb-detail--wide">
      <span className="eb-detail__label">Działa również w</span>
      <div className="eb-otherregs">
        {others.map((r) => (
          <span key={r.woj} className="eb-otherreg">
            <b>{EBUtil.wojName(r.woj)}</b>{r.miasta && r.miasta.length ? " — " + r.miasta.join(", ") : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---- Rozwijana karta (wariant: lista) ----
function AdvisorRow({ a, woj, q, showAvatars }: { a: Advisor; woj: string; q: string; showAvatars: boolean }) {
  const [open, setOpen] = useState(false);
  const cities = EBUtil.citiesIn(a, woj);
  const extra = cities.length - 1;
  return (
    <div className={"eb-row" + (open ? " is-open" : "")}>
      <button className="eb-row__head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {showAvatars && <Avatar a={a} />}
        <span className="eb-row__main">
          <span className="eb-row__name">{a.imie} {a.nazwisko}{a.zweryfikowany && <GreenTick />}</span>
          <span className="eb-row__meta">
            <StatusBadge status={a.status} />
            <span className="eb-row__city">{leadCity(cities, q)}{extra > 0 ? " +" + extra : ""}</span>
          </span>
        </span>
        <span className="eb-row__chev" aria-hidden="true"><Chevron /></span>
      </button>
      <div className="eb-row__panel">
        <div className="eb-row__panelInner">
          <div className="eb-detail eb-detail--wide">
            <span className="eb-detail__label">Miejscowości w {EBUtil.wojName(woj)}</span>
            <CitiesChips cities={cities} />
          </div>
          <div className="eb-detail">
            <span className="eb-detail__label">Specjalność</span>
            <span className="eb-detail__val">{a.specjalnosc}</span>
          </div>
          {a.oferta && a.oferta !== "—" && (
            <div className="eb-detail">
              <span className="eb-detail__label">Oferta dodatkowa</span>
              <span className="eb-detail__val">{a.oferta}</span>
            </div>
          )}
          <OtherRegions a={a} woj={woj} />
          <div className="eb-detail eb-detail--wide">
            <span className="eb-detail__label">Kontakt</span>
            <ContactRows a={a} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Karta (wariant: siatka kart) ----
function AdvisorCardGrid({ a, woj, q, showAvatars }: { a: Advisor; woj: string; q: string; showAvatars: boolean }) {
  const cities = EBUtil.citiesIn(a, woj);
  const extra = cities.length - 1;
  const others = EBUtil.regionsOther(a, woj).length;
  return (
    <div className="eb-card">
      <div className="eb-card__top">
        {showAvatars && <Avatar a={a} size={52} />}
        <div className="eb-card__id">
          <div className="eb-card__name">{a.imie} {a.nazwisko}{a.zweryfikowany && <GreenTick size={16} />}</div>
          <StatusBadge status={a.status} />
        </div>
      </div>
      <div className="eb-card__city"><span aria-hidden="true">📍</span> {leadCity(cities, q)}{extra > 0 ? " i " + extra + " więcej" : ""}{others > 0 ? " · +" + others + " woj." : ""}</div>
      <div className="eb-card__spec">{a.specjalnosc}</div>
      <div className="eb-card__contact">
        <a href={"mailto:" + a.email} title={a.email} aria-label="E-mail"><IcoMail /></a>
        <a href={"tel:" + a.telefon.replace(/\s/g, "")} title={a.telefon} aria-label="Telefon"><IcoPhone /></a>
        {a.www && <a href={wwwHref(a.www)} target="_blank" rel="noopener" title={a.www} aria-label="Strona www"><IcoWww /></a>}
      </div>
    </div>
  );
}

// ---- Wiersz tabeli ----
function AdvisorTableRow({ a, woj, q, showAvatars }: { a: Advisor; woj: string; q: string; showAvatars: boolean }) {
  const cities = EBUtil.citiesIn(a, woj);
  const extra = cities.length - 1;
  return (
    <tr className="eb-trow">
      <td>
        <span className="eb-tcell-name">
          {showAvatars && <Avatar a={a} size={34} />}
          <span>{a.imie} {a.nazwisko}</span>
          {a.zweryfikowany && <GreenTick size={15} />}
        </span>
      </td>
      <td><StatusBadge status={a.status} /></td>
      <td>{leadCity(cities, q)}{extra > 0 ? " +" + extra : ""}</td>
      <td>{a.specjalnosc}</td>
      <td>
        <span className="eb-tcontact">
          <a href={"mailto:" + a.email} title={a.email} aria-label="E-mail"><IcoMail /></a>
          <a href={"tel:" + a.telefon.replace(/\s/g, "")} title={a.telefon} aria-label="Telefon"><IcoPhone /></a>
          {a.www && <a href={wwwHref(a.www)} target="_blank" rel="noopener" title={a.www} aria-label="Strona www"><IcoWww /></a>}
        </span>
      </td>
    </tr>
  );
}

// ---- Toolbar ----
function Toolbar({
  woj, onWojChange, q, setQ, status, setStatus, sort, setSort, total,
}: {
  woj: string;
  onWojChange: (slug: string) => void;
  q: string;
  setQ: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  sort: Sort;
  setSort: (v: Sort) => void;
  total: number;
}) {
  return (
    <div className="eb-toolbar">
      <div className="eb-field eb-field--woj">
        <label>Województwo</label>
        <select value={woj} onChange={(e) => onWojChange(e.target.value)}>
          {WOJ_META.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
        </select>
      </div>
      <div className="eb-search">
        <span className="eb-search__ico" aria-hidden="true">⌕</span>
        <input className="eb-search__input" type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj po nazwisku lub miejscowości…" />
        {q && <button className="eb-search__clear" onClick={() => setQ("")} aria-label="Wyczyść">×</button>}
      </div>
      <div className="eb-field">
        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Wszystkie</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="eb-field">
        <label>Sortuj</label>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="nazwisko">Nazwisko A→Z</option>
          <option value="status">Status</option>
          <option value="miasto">Miejscowość</option>
        </select>
      </div>
      <div className="eb-toolbar__count">{total} {total === 1 ? "specjalista" : "specjalistów"}</div>
    </div>
  );
}

// ---- ListView (infinite scroll z D1, SSR pierwszej strony) ----
export function ListView({
  woj,
  initialItems,
  initialTotal,
  layout,
  showAvatars,
}: {
  woj: string;
  initialItems: Advisor[];
  initialTotal: number;
  layout: ListLayout;
  showAvatars: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [dq, setDq] = useState(""); // wyszukiwanie z opóźnieniem
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<Sort>("nazwisko");

  const [items, setItems] = useState<Advisor[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const reqIdRef = useRef(0);
  const offsetRef = useRef(initialItems.length);
  const hasMoreRef = useRef(initialItems.length < initialTotal);
  const loadingRef = useRef(false);
  const firstRun = useRef(true);

  // debounce pola wyszukiwania
  useEffect(() => {
    const t = setTimeout(() => setDq(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const fetchPage = useCallback(async (reset: boolean) => {
    if (!reset && (loadingRef.current || !hasMoreRef.current)) return;
    const myReq = reset ? ++reqIdRef.current : reqIdRef.current;
    loadingRef.current = true;
    setLoading(true);
    setError(false);
    const offset = reset ? 0 : offsetRef.current;
    try {
      const page = await getAdvisorsPageAction({ woj, q: dq, status, sort, offset, limit: PAGE_SIZE });
      if (myReq !== reqIdRef.current) return; // wynik nieaktualny
      setTotal(page.total);
      setItems((prev) => (reset ? page.items : [...prev, ...page.items]));
      offsetRef.current = offset + page.items.length;
      hasMoreRef.current = offsetRef.current < page.total;
    } catch {
      if (myReq === reqIdRef.current) setError(true);
    } finally {
      if (myReq === reqIdRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [woj, dq, status, sort]);

  // przy zmianie filtra resetuj listę; pomiń pierwszy przebieg (mamy dane z SSR)
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    hasMoreRef.current = true;
    offsetRef.current = 0;
    fetchPage(true);
  }, [fetchPage]);

  // infinite scroll
  const loadMoreRef = useRef<() => void>(() => {});
  loadMoreRef.current = () => { fetchPage(false); };
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMoreRef.current(); },
      { rootMargin: "400px" }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  const empty = !loading && items.length === 0;

  return (
    <div className="eb-panel">
      <div className="eb-listtop">
        <button className="eb-back" onClick={() => router.push("/")}>← Wróć do mapy</button>
        <h2 className="eb-listtop__title">Specjaliści — {EBUtil.wojName(woj)}</h2>
      </div>
      <Toolbar woj={woj} onWojChange={(slug) => router.push("/" + slug)} q={q} setQ={setQ} status={status} setStatus={setStatus} sort={sort} setSort={setSort} total={total} />

      {empty ? (
        <div className="eb-empty">
          {error
            ? "Nie udało się załadować listy. Odśwież stronę i spróbuj ponownie."
            : `Brak specjalistów w województwie ${EBUtil.wojName(woj)} dla podanych kryteriów. Zmień wyszukiwanie lub wybierz inne województwo.`}
        </div>
      ) : (
        <>
          {layout === "karty" ? (
            <div className="eb-grid">
              {items.map((a) => <AdvisorCardGrid key={a.id} a={a} woj={woj} q={dq} showAvatars={showAvatars} />)}
            </div>
          ) : layout === "tabela" ? (
            <div className="eb-tablewrap">
              <table className="eb-table">
                <thead><tr><th>Specjalista</th><th>Status</th><th>Miejscowość</th><th>Specjalność</th><th>Kontakt</th></tr></thead>
                <tbody>{items.map((a) => <AdvisorTableRow key={a.id} a={a} woj={woj} q={dq} showAvatars={showAvatars} />)}</tbody>
              </table>
            </div>
          ) : (
            <div className="eb-list">
              {items.map((a) => <AdvisorRow key={a.id} a={a} woj={woj} q={dq} showAvatars={showAvatars} />)}
            </div>
          )}
          <div ref={sentinelRef} aria-hidden="true" />
          {loading && <p className="eb-map__hint" style={{ marginTop: 16 }}>Ładowanie…</p>}
        </>
      )}
    </div>
  );
}
