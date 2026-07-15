"use client";

// Wspólne komponenty UI (port ui.jsx): Avatar, StatusBadge, WojBadge, Header, HeroBand, Footer

import { useState } from "react";
import Link from "next/link";
import type { Advisor } from "@/lib/easybaby/advisors";
import { EBUtil, photoUrl } from "@/lib/easybaby/advisors";

// ---- Avatar (zdjęcie lub inicjały) ----
export function Avatar({ a, size = 44 }: { a: Advisor; size?: number }) {
  const src = photoUrl(a.zdjecie);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="eb-avatar eb-avatar--photo" src={src} alt={a.imie + " " + a.nazwisko} style={{ width: size, height: size }} />;
  }
  return (
    <span className="eb-avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>{EBUtil.initials(a)}</span>
  );
}

// ---- Badge statusu ----
export function StatusBadge({ status }: { status: string }) {
  if (!status) return null;
  return <span className={"eb-status eb-status--" + EBUtil.statusTone(status)}>{status}</span>;
}

// ---- Badge województwa ----
export function WojBadge({ slug, onClick }: { slug: string; onClick?: () => void }) {
  return (
    <span className={"eb-wbadge" + (onClick ? " is-link" : "")} onClick={onClick}>
      <span className="eb-wbadge__dot" aria-hidden="true"></span>{EBUtil.wojName(slug)}
    </span>
  );
}

// ---- Header (wierna replika paska easybaby.pl) ----
const EXTERNAL_NAV = [
  { label: "Kursy", href: "https://easybaby.pl/kategorie" },
  { label: "O szkole", href: "https://easybaby.pl/o-szkole" },
  { label: "Baza wiedzy", href: "https://easybaby.pl/blog" },
  { label: "dla RODZICA", href: "https://izabelabanach.pl/strefa-rodzica/" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="ebsite-header">
      <div className="ebsite-header__inner">
        <a className="ebsite-brand" href="https://easybaby.pl" aria-label="EasyBaby">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/easybaby-logo.png" alt="EasyBaby" />
        </a>
        <button className="ebsite-burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </button>
        <div className={"ebsite-collapse" + (open ? " is-open" : "")}>
          <ul className="ebsite-nav">
            {EXTERNAL_NAV.map((l) => (
              <li key={l.label}><a href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a></li>
            ))}
            <li>
              <Link href="/" onClick={() => setOpen(false)}>Specjaliści</Link>
            </li>
          </ul>
          <div className="ebsite-actions">
            <a className="ebsite-btn" href="https://easybaby.pl/login">Zaloguj się</a>
            <a className="ebsite-btn" href="https://easybaby.pl/rejestracja">Zarejestruj się</a>
            <a className="ebsite-btn" href="https://easybaby.pl/koszyk">Koszyk</a>
          </div>
        </div>
      </div>
    </header>
  );
}

// ---- Hero band ----
export function HeroBand({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="eb-hero">
      <span className="eb-bubble eb-bubble--1" aria-hidden="true"></span>
      <span className="eb-bubble eb-bubble--2" aria-hidden="true"></span>
      <span className="eb-bubble eb-bubble--3" aria-hidden="true"></span>
      <span className="eb-bubble eb-bubble--4" aria-hidden="true"></span>
      <div className="eb-hero__inner">
        <h1 className="eb-hero__title">{title}</h1>
        {subtitle && subtitle.split(/\n\s*\n/).map((p, i) => <p key={i} className="eb-hero__sub">{p}</p>)}
        {children}
      </div>
    </div>
  );
}

// ---- Footer (wierna replika stopki easybaby.pl) ----
function IcoGlobe() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.6 2.5 2.6 15.5 0 18M12 3c-2.6 2.5-2.6 15.5 0 18" />
    </svg>
  );
}
function IcoFacebook() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H17V3.7c-.3-.04-1.3-.13-2.46-.13-2.43 0-4.1 1.49-4.1 4.22v2.1H7.7V13h2.74v8h3.06z" />
    </svg>
  );
}
function IcoYoutube() {
  return (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="currentColor" aria-hidden="true">
      <path d="M23 12s0-3.2-.41-4.73a2.47 2.47 0 0 0-1.74-1.75C19.31 5.1 12 5.1 12 5.1s-7.31 0-8.85.42A2.47 2.47 0 0 0 1.41 7.27C1 8.8 1 12 1 12s0 3.2.41 4.73c.23.85.9 1.52 1.74 1.75 1.54.42 8.85.42 8.85.42s7.31 0 8.85-.42a2.47 2.47 0 0 0 1.74-1.75C23 15.2 23 12 23 12zM9.75 15.27V8.73L15.5 12z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="ebsite-footer">
      <div className="ebsite-footer__inner">
        <a className="ebsite-brand" href="https://easybaby.pl" aria-label="EasyBaby">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/easybaby-logo.png" alt="EasyBaby" />
        </a>
        <ul className="ebsite-footer__nav">
          <li><a href="https://easybaby.pl/regulamin" target="_blank" rel="noopener noreferrer">Regulamin</a></li>
          <li><a href="https://easybaby.pl/szukaj" target="_blank" rel="noopener noreferrer">Szukaj</a></li>
          <li><a href="https://easybaby.pl/kontakt" target="_blank" rel="noopener noreferrer">Kontakt</a></li>
          <li><a href="https://easybaby.pl/faq" target="_blank" rel="noopener noreferrer">FAQ</a></li>
        </ul>
        <div className="ebsite-social">
          <a href="https://easybaby.pl" target="_blank" rel="noopener noreferrer" aria-label="Strona internetowa"><IcoGlobe /></a>
          <a href="https://www.facebook.com/NaturalnieIzabelaBanach" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><IcoFacebook /></a>
          <a href="https://www.youtube.com/@EasyBabyWearing" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><IcoYoutube /></a>
        </div>
      </div>
    </footer>
  );
}
