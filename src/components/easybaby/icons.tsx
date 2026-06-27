// Ikonki kontaktu + ptaszek weryfikacji (port z list.jsx / ui.jsx)

export function IcoMail() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16">
      <rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IcoPhone() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16">
      <path d="M6 3h3l1.5 5-2 1.5a12 12 0 005 5l1.5-2 5 1.5v3a2 2 0 01-2 2A16 16 0 014 5a2 2 0 012-2z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function IcoWww() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function Chevron() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16">
      <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GreenTick({ size = 18 }: { size?: number }) {
  return (
    <span className="eb-tick" title="Zweryfikowany" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size} height={size} aria-label="Zweryfikowany">
        <circle cx="12" cy="12" r="11" fill="currentColor" />
        <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
