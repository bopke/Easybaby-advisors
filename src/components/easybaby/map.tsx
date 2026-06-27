"use client";

// Mapa specjalistów (port map.jsx): PolandMap + MapView

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { POLAND } from "@/lib/easybaby/poland-map";
import { EBUtil } from "@/lib/easybaby/advisors";

type MapStyle = "outline" | "fill";

function plSpecjalista(n: number) {
  return n === 1 ? "specjalista" : "specjalistów";
}

// ---- SVG mapa Polski ----
export function PolandMap({
  highlight,
  onPick,
  counts,
  style,
}: {
  highlight?: string;
  onPick?: (slug: string) => void;
  counts?: Record<string, number> | null;
  style: MapStyle;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const [tip, setTip] = useState({ x: 0, y: 0, show: false });
  const wrapRef = useRef<HTMLDivElement>(null);

  function move(e: React.MouseEvent, slug: string) {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    setHover(slug);
    setTip({ x: e.clientX - r.left, y: e.clientY - r.top, show: true });
  }

  return (
    <div className={"eb-map eb-map--" + style} ref={wrapRef}>
      <svg viewBox={POLAND.viewBox} className="eb-map__svg" role="img" aria-label="Mapa województw Polski">
        {POLAND.regions.map((r) => {
          const active = highlight ? r.slug === highlight : false;
          const isHover = hover === r.slug;
          return (
            <path
              key={r.slug}
              d={r.d}
              className={"eb-region" + (active ? " is-active" : "") + (isHover ? " is-hover" : "")}
              onMouseMove={onPick ? (e) => move(e, r.slug) : undefined}
              onMouseLeave={onPick ? () => { setHover(null); setTip((t) => ({ ...t, show: false })); } : undefined}
              onClick={onPick ? () => onPick(r.slug) : undefined}
              style={{ cursor: onPick ? "pointer" : "default" }}
            />
          );
        })}
      </svg>
      {onPick && tip.show && hover && (
        <div className="eb-maptip" style={{ left: tip.x, top: tip.y }}>
          <strong>{EBUtil.wojName(hover)}</strong>
          {counts && <span> · {counts[hover] || 0} {plSpecjalista(counts[hover] || 0)}</span>}
        </div>
      )}
    </div>
  );
}

// ---- MapView (mapa + lista województw) ----
export function MapView({
  counts,
  mapStyle,
  showCounts,
}: {
  counts: Record<string, number>;
  mapStyle: MapStyle;
  showCounts: boolean;
}) {
  const router = useRouter();
  const go = (slug: string) => router.push("/" + slug);
  const coll = new Intl.Collator("pl");
  const sorted = POLAND.regions.slice().sort((a, b) => coll.compare(a.name, b.name));
  return (
    <div className="eb-panel">
      <div className="eb-maplayout">
        <div className="eb-mapcol">
          <PolandMap onPick={go} counts={showCounts ? counts : null} style={mapStyle} />
          <p className="eb-map__hint">Najedź na region, aby zobaczyć liczbę specjalistów · kliknij, aby otworzyć województwo</p>
        </div>
        <div className="eb-wojcol">
          <h2 className="eb-wojcol__title">Wybierz województwo</h2>
          <ul className="eb-wojlist">
            {sorted.map((r) => (
              <li key={r.slug}>
                <a className="eb-wojlink" href={"/" + r.slug} onClick={(e) => { e.preventDefault(); go(r.slug); }}>
                  <span className="eb-wojlink__dot" aria-hidden="true"></span>
                  <span className="eb-wojlink__name">{r.name}</span>
                  {showCounts && <span className="eb-wojlink__count">{counts[r.slug] || 0}</span>}
                </a>
              </li>
            ))}
          </ul>
          <a className="eb-wojlink eb-wojlink--foreign" href="/zagranica" onClick={(e) => { e.preventDefault(); go("zagranica"); }}>
            <span className="eb-wojlink__globe" aria-hidden="true">◉</span>
            <span className="eb-wojlink__name">Specjaliści za granicą Polski</span>
            {showCounts && <span className="eb-wojlink__count">{counts["zagranica"] || 0}</span>}
          </a>
        </div>
      </div>
    </div>
  );
}
