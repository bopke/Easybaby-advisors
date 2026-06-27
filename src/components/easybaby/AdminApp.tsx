"use client";

// Panel administracyjny EasyBaby (port admin.jsx). Logowanie: prawdziwe Google
// (Auth.js) — ekran logowania jest osobnym Server Component (AdminLogin), tutaj
// renderujemy już zalogowaną powłokę. CRUD specjalistów: localStorage (prototyp).
// Allowlista: D1 przez akcje serwerowe.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EBUtil, photoUrl, STATUSES, WOJ_META } from "@/lib/easybaby/advisors";
import type { Advisor, AllowEntry, Region } from "@/lib/easybaby/advisors";
import {
  addAllowAction, createAdvisorAction, deleteAdvisorAction, getAdvisorsAdminAction,
  getAllowlistAction, removeAllowAction, signOutAction, updateAdvisorAction,
} from "@/app/admin/actions";
import "./admin.css";

const coll = new Intl.Collator("pl");
const wojName = (slug: string) => EBUtil.wojName(slug);
const statusTone = (status: string) => EBUtil.statusTone(status);
const advCities = (a: Advisor) => EBUtil.citiesIn(a);
const advHasWoj = (a: Advisor, woj: string) => EBUtil.hasWoj(a, woj);

type AdvisorDraft = Omit<Advisor, "id"> & { id?: string };
type Editing = Advisor | "new" | null;
type AdminUser = { email: string; name: string | null; image: string | null };

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17"><path d="M5 7h14M10 7V5h4v2M6 7l1 13h10l1-13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

// ====== Formularz doradcy (modal) ======
const EMPTY: AdvisorDraft = {
  imie: "", nazwisko: "", status: "doradca easybaby", zweryfikowany: false, zdjecie: "",
  regiony: [{ woj: "mazowieckie", miasta: [] }],
  email: "", telefon: "", www: "", specjalnosc: "", oferta: "",
  dataUprawnien: "", dataDolaczenia: "", dataWeryfikacji: "", dataUtraty: "",
};

// edytor pojedynczego regionu (województwo + miasta)
function RegionEditor({
  region, canRemove, onWoj, onAddCity, onRemoveCity, onReorder, onRemove,
}: {
  region: Region;
  canRemove: boolean;
  onWoj: (woj: string) => void;
  onAddCity: (c: string) => void;
  onRemoveCity: (c: string) => void;
  onReorder: (from: number, to: number) => void;
  onRemove: () => void;
}) {
  const [city, setCity] = useState("");
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  function add() { onAddCity(city); setCity(""); }
  function key(e: React.KeyboardEvent) { if (e.key === "Enter") { e.preventDefault(); add(); } }
  function drop() {
    if (drag !== null && over !== null && drag !== over) onReorder(drag, over);
    setDrag(null); setOver(null);
  }
  return (
    <div className="adm-region">
      <div className="adm-region__head">
        <select className="adm-region__woj" value={region.woj} onChange={(e) => onWoj(e.target.value)}>
          {WOJ_META.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
        </select>
        {canRemove && <button type="button" className="adm-region__rm" onClick={onRemove}>Usuń województwo</button>}
      </div>
      <div className="adm-tags adm-tags--drag">
        {region.miasta.map((c, i) => (
          <span
            key={c}
            className={"adm-tag adm-tag--drag" + (i === 0 ? " is-primary" : "") + (drag === i ? " is-dragging" : "") + (over === i && drag !== null && drag !== i ? " is-over" : "")}
            draggable={region.miasta.length > 1}
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => { e.preventDefault(); if (over !== i) setOver(i); }}
            onDrop={(e) => { e.preventDefault(); drop(); }}
            onDragEnd={() => { setDrag(null); setOver(null); }}
          >
            {region.miasta.length > 1 && <span className="adm-tag__grip" aria-hidden="true">⠿</span>}
            {i === 0 && <span className="adm-tag__main">główne</span>}
            {c}
            <button type="button" onClick={() => onRemoveCity(c)} aria-label="Usuń">×</button>
          </span>
        ))}
        {region.miasta.length === 0 && <span className="adm-tags__empty">Brak miast — dodaj poniżej</span>}
      </div>
      {region.miasta.length > 1 && <p className="adm-region__hint">Przeciągnij miasta, aby zmienić kolejność — pierwsze jest główne na liście.</p>}
      <div className="adm-tagadd">
        <input value={city} onChange={(e) => setCity(e.target.value)} onKeyDown={key} placeholder="np. Warszawa, wpisz i naciśnij Enter" />
        <button type="button" className="adm-btn adm-btn--ghost" onClick={add}>Dodaj miasto</button>
      </div>
    </div>
  );
}

function AdvisorForm({ initial, onSave, onClose }: { initial: Advisor | null; onSave: (data: AdvisorDraft, photo: File | null, removePhoto: boolean) => void; onClose: () => void }) {
  const [f, setF] = useState<AdvisorDraft>(initial
    ? { ...EMPTY, ...initial, regiony: (initial.regiony && initial.regiony.length ? initial.regiony.map((r) => ({ woj: r.woj, miasta: (r.miasta || []).slice() })) : [{ woj: "mazowieckie", miasta: [] }]) }
    : EMPTY);
  const [err, setErr] = useState<Record<string, number>>({});
  const firstRef = useRef<HTMLInputElement>(null);
  useEffect(() => { firstRef.current?.focus(); }, []);

  // Zdjęcie: nowy plik wgrywany jest dopiero przy zapisie; tutaj tylko podgląd.
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [removePhoto, setRemovePhoto] = useState(false);
  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview); }, [photoPreview]);

  const photoSrc = photoFile ? photoPreview : (!removePhoto && f.zdjecie ? photoUrl(f.zdjecie) : "");
  function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setRemovePhoto(false);
  }
  function clearPhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview("");
    setRemovePhoto(true);
  }

  function set<K extends keyof AdvisorDraft>(k: K, v: AdvisorDraft[K]) { setF((s) => ({ ...s, [k]: v })); }
  function setRegionWoj(idx: number, woj: string) { setF((s) => ({ ...s, regiony: s.regiony.map((r, i) => (i === idx ? { ...r, woj } : r)) })); }
  function addCityTo(idx: number, raw: string) {
    const c = raw.trim();
    if (!c) return;
    setF((s) => ({ ...s, regiony: s.regiony.map((r, i) => (i === idx ? (r.miasta.includes(c) ? r : { ...r, miasta: [...r.miasta, c] }) : r)) }));
  }
  function removeCityFrom(idx: number, c: string) { setF((s) => ({ ...s, regiony: s.regiony.map((r, i) => (i === idx ? { ...r, miasta: r.miasta.filter((x) => x !== c) } : r)) })); }
  function reorderCityIn(idx: number, from: number, to: number) {
    setF((s) => ({ ...s, regiony: s.regiony.map((r, i) => {
      if (i !== idx) return r;
      const arr = r.miasta.slice();
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return { ...r, miasta: arr };
    }) }));
  }
  function addRegion() {
    setF((s) => {
      const all = WOJ_META.map((m) => m.slug);
      const free = all.find((w) => !s.regiony.some((r) => r.woj === w)) || all[0];
      return { ...s, regiony: [...s.regiony, { woj: free, miasta: [] }] };
    });
  }
  function removeRegion(idx: number) { setF((s) => ({ ...s, regiony: s.regiony.filter((_, i) => i !== idx) })); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Record<string, number> = {};
    if (!f.imie.trim()) er.imie = 1;
    if (!f.nazwisko.trim()) er.nazwisko = 1;
    if (!f.regiony.length || f.regiony.some((r) => !r.miasta.length)) er.regiony = 1;
    if (!f.email.trim()) er.email = 1;
    setErr(er);
    if (Object.keys(er).length) return;
    onSave({ ...f }, photoFile, removePhoto);
  }

  return (
    <div className="adm-modal" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="adm-sheet" onSubmit={submit}>
        <div className="adm-sheet__head">
          <h2>{initial ? "Edytuj specjalistę" : "Nowy specjalista"}</h2>
          <button type="button" className="adm-x" onClick={onClose} aria-label="Zamknij">×</button>
        </div>
        <div className="adm-sheet__body">
          <div className="adm-grid2">
            <label className={"adm-f" + (err.imie ? " is-err" : "")}>
              <span>Imię</span>
              <input ref={firstRef} value={f.imie} onChange={(e) => set("imie", e.target.value)} placeholder="np. Anna" />
            </label>
            <label className={"adm-f" + (err.nazwisko ? " is-err" : "")}>
              <span>Nazwisko</span>
              <input value={f.nazwisko} onChange={(e) => set("nazwisko", e.target.value)} placeholder="np. Kowalska" />
            </label>
          </div>

          <div className="adm-grid2">
            <label className="adm-f">
              <span>Status</span>
              <select value={f.status} onChange={(e) => set("status", e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="adm-check">
              <input type="checkbox" checked={f.zweryfikowany} onChange={(e) => set("zweryfikowany", e.target.checked)} />
              <span>Zweryfikowany <small>(zielony znacznik na liście)</small></span>
            </label>
          </div>

          <div className="adm-f">
            <span>Zdjęcie <small>(opcjonalnie; JPG/PNG/WEBP/GIF, max 5 MB — puste = inicjały)</small></span>
            <div className="adm-photo">
              <div className="adm-photo__preview">
                {photoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoSrc} alt="Podgląd zdjęcia" />
                ) : (
                  <span className="adm-photo__placeholder">{((f.imie[0] || "") + (f.nazwisko[0] || "")) || "?"}</span>
                )}
              </div>
              <div className="adm-photo__actions">
                <label className="adm-btn adm-btn--ghost">
                  {photoSrc ? "Zmień zdjęcie" : "Wgraj zdjęcie"}
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={pickPhoto} hidden />
                </label>
                {photoSrc && <button type="button" className="adm-btn adm-btn--danger" onClick={clearPhoto}>Usuń zdjęcie</button>}
              </div>
            </div>
          </div>

          <div className={"adm-f" + (err.regiony ? " is-err" : "")}>
            <span>Województwa i miejscowości działania <small>(pierwsze miasto = główne na liście; każde województwo wymaga min. 1 miasta)</small></span>
            <div className="adm-regions">
              {f.regiony.map((r, idx) => (
                <RegionEditor key={idx} region={r} canRemove={f.regiony.length > 1}
                  onWoj={(w) => setRegionWoj(idx, w)} onAddCity={(c) => addCityTo(idx, c)}
                  onRemoveCity={(c) => removeCityFrom(idx, c)} onReorder={(from, to) => reorderCityIn(idx, from, to)} onRemove={() => removeRegion(idx)} />
              ))}
            </div>
            <button type="button" className="adm-btn adm-btn--ghost adm-addregion" onClick={addRegion}>+ Dodaj województwo</button>
          </div>

          <div className="adm-grid2">
            <label className={"adm-f" + (err.email ? " is-err" : "")}>
              <span>E-mail</span>
              <input value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="np. anna@easybaby.pl" />
            </label>
            <label className="adm-f">
              <span>Telefon</span>
              <input value={f.telefon} onChange={(e) => set("telefon", e.target.value)} placeholder="np. +48 500 100 200" />
            </label>
          </div>

          <label className="adm-f">
            <span>Adres strony www <small>(opcjonalnie)</small></span>
            <input value={f.www} onChange={(e) => set("www", e.target.value)} placeholder="np. www.annakowalska.pl" />
          </label>

          <label className="adm-f">
            <span>Specjalność</span>
            <input value={f.specjalnosc} onChange={(e) => set("specjalnosc", e.target.value)} placeholder="np. Noszenie w chuście" />
          </label>

          <label className="adm-f">
            <span>Oferta dodatkowa <small>(opcjonalnie)</small></span>
            <input value={f.oferta === "—" ? "" : f.oferta} onChange={(e) => set("oferta", e.target.value)} placeholder="np. Konsultacje online, wizyty domowe" />
          </label>

          <div className="adm-adminbox">
            <div className="adm-adminbox__head">
              <span className="adm-adminbox__title">Dane administracyjne</span>
              <span className="adm-adminbox__note">tylko w panelu — nie wpływa na listę</span>
            </div>
            <div className="adm-grid2">
              <label className="adm-f">
                <span>Data uzyskania uprawnień</span>
                <input type="date" value={f.dataUprawnien} onChange={(e) => set("dataUprawnien", e.target.value)} />
              </label>
              <label className="adm-f">
                <span>Data dołączenia do serwisu</span>
                <input type="date" value={f.dataDolaczenia} onChange={(e) => set("dataDolaczenia", e.target.value)} />
              </label>
              <label className="adm-f">
                <span>Data weryfikacji</span>
                <input type="date" value={f.dataWeryfikacji} onChange={(e) => set("dataWeryfikacji", e.target.value)} />
              </label>
              <label className="adm-f">
                <span>Data utraty uprawnień</span>
                <input type="date" value={f.dataUtraty} onChange={(e) => set("dataUtraty", e.target.value)} />
              </label>
            </div>
          </div>
        </div>
        <div className="adm-sheet__foot">
          <button type="button" className="adm-btn adm-btn--ghost" onClick={onClose}>Anuluj</button>
          <button type="submit" className="adm-btn adm-btn--solid">{initial ? "Zapisz zmiany" : "Dodaj specjalistę"}</button>
        </div>
      </form>
    </div>
  );
}

// ====== Potwierdzenie ======
function Confirm({ title, text, confirmLabel, onConfirm, onClose }: { title: string; text: string; confirmLabel: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="adm-modal" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="adm-confirm">
        <h2>{title}</h2>
        <p>{text}</p>
        <div className="adm-confirm__foot">
          <button className="adm-btn adm-btn--ghost" onClick={onClose}>Anuluj</button>
          <button className="adm-btn adm-btn--danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ====== Zakładka: Doradcy ======
function AdvisorsTab({ toast }: { toast: (m: string) => void }) {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [woj, setWoj] = useState("");
  const [editing, setEditing] = useState<Editing>(null);
  const [delTarget, setDelTarget] = useState<Advisor | null>(null);

  const refresh = useCallback(async () => {
    try { setAdvisors(await getAdvisorsAdminAction()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const view = useMemo(() => {
    let arr = advisors.slice();
    const qq = q.trim().toLowerCase();
    if (qq) arr = arr.filter((a) => (a.imie + " " + a.nazwisko).toLowerCase().includes(qq) || advCities(a).some((c) => c.toLowerCase().includes(qq)));
    if (woj) arr = arr.filter((a) => advHasWoj(a, woj));
    arr.sort((x, y) => coll.compare(x.nazwisko, y.nazwisko) || coll.compare(x.imie, y.imie));
    return arr;
  }, [advisors, q, woj]);

  async function save(data: AdvisorDraft, photo: File | null, removePhoto: boolean) {
    try {
      if (editing && editing !== "new") {
        await updateAdvisorAction({ ...editing, ...data, id: editing.id }, photo, removePhoto);
        toast("Zapisano zmiany dla " + data.imie + " " + data.nazwisko);
      } else {
        await createAdvisorAction(data, photo); // serwer i tak nadaje własne id
        toast("Dodano specjalistę: " + data.imie + " " + data.nazwisko);
      }
      setEditing(null);
      await refresh();
    } catch {
      toast("Nie udało się zapisać zmian.");
    }
  }
  async function doDelete() {
    if (!delTarget) return;
    try {
      await deleteAdvisorAction(delTarget.id);
      toast("Usunięto: " + delTarget.imie + " " + delTarget.nazwisko);
    } catch {
      toast("Nie udało się usunąć specjalisty.");
    } finally {
      setDelTarget(null);
      await refresh();
    }
  }

  return (
    <div>
      <div className="adm-toolbar">
        <div className="adm-search">
          <span aria-hidden="true">⌕</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj po nazwisku lub miejscowości…" />
        </div>
        <select className="adm-select" value={woj} onChange={(e) => setWoj(e.target.value)}>
          <option value="">Wszystkie województwa</option>
          {WOJ_META.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
        </select>
        <span className="adm-count">{view.length} z {advisors.length}</span>
        <button className="adm-btn adm-btn--solid" onClick={() => setEditing("new")}>+ Dodaj specjalistę</button>
      </div>

      <div className="adm-tablewrap">
        <table className="adm-table">
          <thead>
            <tr><th>Specjalista</th><th>Status</th><th>Województwa i miejscowości</th><th className="adm-th-act">Akcje</th></tr>
          </thead>
          <tbody>
            {view.map((a) => (
              <tr key={a.id}>
                <td className="adm-td-name">
                  <span className="adm-name-cell">{a.imie} {a.nazwisko}{a.zweryfikowany && <span className="adm-tick" title="Zweryfikowany"><svg viewBox="0 0 24 24" width="15" height="15"><circle cx="12" cy="12" r="11" fill="currentColor" /><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg></span>}</span>
                </td>
                <td><span className={"adm-statusbadge adm-statusbadge--" + statusTone(a.status)}>{a.status}</span></td>
                <td className="adm-td-regions">
                  {(a.regiony || []).map((r) => (
                    <span key={r.woj} className="adm-regchip"><b>{wojName(r.woj)}</b>{r.miasta && r.miasta.length ? ": " + r.miasta.join(", ") : ""}</span>
                  ))}
                </td>
                <td className="adm-td-act">
                  <button className="adm-iconbtn" title="Edytuj" onClick={() => setEditing(a)}>
                    <svg viewBox="0 0 24 24" width="17" height="17"><path d="M4 20h4l10-10-4-4L4 16v4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M14 6l4 4" stroke="currentColor" strokeWidth="2" /></svg>
                  </button>
                  <button className="adm-iconbtn adm-iconbtn--danger" title="Usuń" onClick={() => setDelTarget(a)}>
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
            {view.length === 0 && (
              <tr><td colSpan={4} className="adm-empty">{loading ? "Wczytywanie…" : "Brak specjalistów dla podanych kryteriów."}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && <AdvisorForm initial={editing === "new" ? null : editing} onSave={save} onClose={() => setEditing(null)} />}
      {delTarget && (
        <Confirm
          title="Usunąć specjalistę?"
          text={"Czy na pewno usunąć „" + delTarget.imie + " " + delTarget.nazwisko + "”? Tej operacji nie można cofnąć."}
          confirmLabel="Usuń"
          onConfirm={doDelete}
          onClose={() => setDelTarget(null)}
        />
      )}
    </div>
  );
}

// ====== Zakładka: Dostęp (allowlista w D1) ======
function AccessTab({ currentEmail, toast }: { currentEmail: string; toast: (m: string) => void }) {
  const [list, setList] = useState<AllowEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [delTarget, setDelTarget] = useState<AllowEntry | null>(null);

  useEffect(() => {
    getAllowlistAction().then((l) => { setList(l); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { setErr("Podaj poprawny adres e-mail."); return; }
    if (list.some((x) => x.email.toLowerCase() === em)) { setErr("Ten adres jest już na liście."); return; }
    setErr(""); setBusy(true);
    try {
      setList(await addAllowAction(em));
      toast("Dodano dostęp: " + em);
      setEmail("");
    } catch { setErr("Nie udało się dodać adresu."); } finally { setBusy(false); }
  }
  async function remove() {
    if (!delTarget) return;
    setBusy(true);
    try {
      setList(await removeAllowAction(delTarget.email));
      toast("Cofnięto dostęp: " + delTarget.email);
    } catch { toast("Nie udało się cofnąć dostępu."); } finally { setBusy(false); setDelTarget(null); }
  }

  return (
    <div>
      <div className="adm-access">
        <div className="adm-card">
          <h3 className="adm-card__title">Dodaj autoryzowany adres</h3>
          <p className="adm-card__sub">Tylko konta Google z tej listy mogą zalogować się do panelu.</p>
          <form className="adm-addform" onSubmit={add}>
            <label className="adm-f">
              <span>Adres e-mail (Google)</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="osoba@example.com" />
            </label>
            {err && <div className="adm-inlineerr">{err}</div>}
            <button type="submit" className="adm-btn adm-btn--solid" disabled={busy}>+ Nadaj dostęp</button>
          </form>
        </div>

        <div className="adm-card">
          <h3 className="adm-card__title">Autoryzowane adresy <span className="adm-card__n">{list.length}</span></h3>
          {loading ? (
            <p className="adm-card__sub">Wczytywanie…</p>
          ) : (
            <ul className="adm-acclist">
              {list.map((e) => {
                const me = e.email.toLowerCase() === currentEmail.toLowerCase();
                return (
                  <li key={e.email} className="adm-accrow">
                    <span className="adm-accrow__av">{e.email[0].toUpperCase()}</span>
                    <span className="adm-accrow__main">
                      <span className="adm-accrow__name">{e.email}{me && <span className="adm-you">to Ty</span>}</span>
                      {e.added && <span className="adm-accrow__email">dodano {e.added}</span>}
                    </span>
                    <button className="adm-iconbtn adm-iconbtn--danger" disabled={me || busy} title={me ? "Nie możesz cofnąć dostępu sobie" : "Cofnij dostęp"} onClick={() => !me && setDelTarget(e)}>
                      <TrashIcon />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {delTarget && (
        <Confirm
          title="Cofnąć dostęp?"
          text={"Konto „" + delTarget.email + "” straci możliwość logowania do panelu."}
          confirmLabel="Cofnij dostęp"
          onConfirm={remove}
          onClose={() => setDelTarget(null)}
        />
      )}
    </div>
  );
}

// ====== Toast ======
function useToast(): [(m: string) => void, React.ReactNode] {
  const [msg, setMsg] = useState<string | null>(null);
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function show(m: string) {
    setMsg(m);
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setMsg(null), 2600);
  }
  const node = msg ? <div className="adm-toast">{msg}</div> : null;
  return [show, node];
}

// ====== Aplikacja (zalogowana powłoka) ======
export function AdminApp({ user }: { user: AdminUser }) {
  const [tab, setTab] = useState<"doradcy" | "dostep">("doradcy");
  const [menu, setMenu] = useState(false);
  const [toast, toastNode] = useToast();

  const initial = (user.name || user.email)[0]?.toUpperCase() || "?";

  return (
    <div className="adm-root">
      <header className="adm-top">
        <div className="adm-top__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo-easybaby.png" alt="EasyBaby" />
          <span className="adm-top__name">Panel <b>EasyBaby</b></span>
        </div>
        <nav className="adm-tabs">
          <button className={tab === "doradcy" ? "is-active" : ""} onClick={() => setTab("doradcy")}>Specjaliści</button>
          <button className={tab === "dostep" ? "is-active" : ""} onClick={() => setTab("dostep")}>Dostęp</button>
        </nav>
        <div className="adm-user" onClick={() => setMenu((m) => !m)}>
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="adm-user__av" src={user.image} alt="" style={{ objectFit: "cover" }} />
          ) : (
            <span className="adm-user__av" style={{ background: "#6e7a52" }}>{initial}</span>
          )}
          <div className="adm-user__meta">
            <span className="adm-user__name">{user.name || user.email}</span>
          </div>
          {menu && (
            <div className="adm-usermenu" onClick={(e) => e.stopPropagation()}>
              <div className="adm-usermenu__email">{user.email}</div>
              <a className="adm-usermenu__link" href="/">↗ Zobacz publiczną listę</a>
              <form action={signOutAction}>
                <button type="submit" className="adm-usermenu__logout">Wyloguj się</button>
              </form>
            </div>
          )}
        </div>
      </header>

      <main className="adm-main">
        <div className="adm-head">
          <h1>{tab === "doradcy" ? "Specjaliści" : "Zarządzanie dostępem"}</h1>
          <p>{tab === "doradcy" ? "Dodawaj, edytuj i usuwaj specjalistów widocznych na stronie." : "Decyduj, które konta Google mają dostęp do panelu."}</p>
        </div>
        {tab === "doradcy" ? <AdvisorsTab toast={toast} /> : <AccessTab currentEmail={user.email} toast={toast} />}
      </main>
      {toastNode}
    </div>
  );
}
