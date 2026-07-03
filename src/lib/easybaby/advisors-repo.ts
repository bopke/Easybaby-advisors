import "server-only";

// Dostęp do specjalistów w D1 — jedyne źródło prawdy dla publicznej listy i panelu.

import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Advisor, Region } from "./advisors";

export type PublicSort = "nazwisko" | "status" | "miasto";
export type PublicPageParams = { woj: string; q: string; status: string; sort: PublicSort; offset: number; limit: number };
export type PublicPage = { items: Advisor[]; total: number };

const COLUMNS = [
  "id", "imie", "nazwisko", "status", "zweryfikowany", "zdjecie", "regiony",
  "email", "telefon", "www", "specjalnosc", "oferta",
  "dataUprawnien", "dataDolaczenia", "dataWeryfikacji", "dataUtraty",
] as const;

async function db(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  return env.DB;
}

type Row = Record<string, unknown>;

function rowToAdvisor(r: Row): Advisor {
  let regiony: Region[] = [];
  try { regiony = JSON.parse((r.regiony as string) || "[]"); } catch { regiony = []; }
  return {
    id: String(r.id),
    imie: (r.imie as string) ?? "",
    nazwisko: (r.nazwisko as string) ?? "",
    status: (r.status as string) ?? "",
    zweryfikowany: !!r.zweryfikowany,
    zdjecie: (r.zdjecie as string) ?? "",
    regiony,
    email: (r.email as string) ?? "",
    telefon: (r.telefon as string) ?? "",
    www: (r.www as string) ?? "",
    specjalnosc: (r.specjalnosc as string) ?? "",
    oferta: (r.oferta as string) ?? "",
    dataUprawnien: (r.dataUprawnien as string) ?? "",
    dataDolaczenia: (r.dataDolaczenia as string) ?? "",
    dataWeryfikacji: (r.dataWeryfikacji as string) ?? "",
    dataUtraty: (r.dataUtraty as string) ?? "",
  };
}

function insertStmt(DB: D1Database, a: Advisor) {
  const placeholders = COLUMNS.map(() => "?").join(", ");
  return DB.prepare(`INSERT OR IGNORE INTO advisors (${COLUMNS.join(", ")}) VALUES (${placeholders})`).bind(
    a.id, a.imie, a.nazwisko, a.status, a.zweryfikowany ? 1 : 0, a.zdjecie, JSON.stringify(a.regiony),
    a.email, a.telefon, a.www, a.specjalnosc, a.oferta,
    a.dataUprawnien, a.dataDolaczenia, a.dataWeryfikacji, a.dataUtraty,
  );
}

function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => "\\" + c);
}

// ----- Public reads -----

/** Liczba specjalistów na województwo (klucze = sluga woj, w tym "zagranica"). */
export async function getWojCounts(): Promise<Record<string, number>> {
  const DB = await db();
  const { results } = await DB.prepare(
    `SELECT json_extract(r.value, '$.woj') AS woj, COUNT(DISTINCT a.id) AS n
     FROM advisors a, json_each(a.regiony) r
     GROUP BY woj`
  ).all<{ woj: string; n: number }>();
  const out: Record<string, number> = {};
  for (const row of results ?? []) out[row.woj] = row.n;
  return out;
}

/** Strona publicznej listy dla wybranego województwa (filtr + sort + paginacja). */
export async function listPublicAdvisors(p: PublicPageParams): Promise<PublicPage> {
  const DB = await db();

  const where: string[] = ["EXISTS (SELECT 1 FROM json_each(a.regiony) r WHERE json_extract(r.value, '$.woj') = ?)"];
  const whereBinds: unknown[] = [p.woj];
  if (p.status) { where.push("a.status = ?"); whereBinds.push(p.status); }
  if (p.q.trim()) {
    const like = "%" + escapeLike(p.q.trim()) + "%";
    where.push(
      "((a.imie || ' ' || a.nazwisko) LIKE ? ESCAPE '\\' OR EXISTS (SELECT 1 FROM json_each(a.regiony) rq, json_each(json_extract(rq.value, '$.miasta')) c WHERE c.value LIKE ? ESCAPE '\\'))"
    );
    whereBinds.push(like, like);
  }
  const whereSql = where.join(" AND ");

  const totalRow = await DB.prepare(`SELECT COUNT(*) AS n FROM advisors a WHERE ${whereSql}`).bind(...whereBinds).first<{ n: number }>();
  const total = totalRow?.n ?? 0;

  // Zweryfikowani specjaliści zawsze na górze, niezależnie od wybranego sortowania.
  const VERIFIED_FIRST = "a.zweryfikowany DESC, ";
  let selectExtra = "";
  let order = VERIFIED_FIRST + "a.nazwisko COLLATE NOCASE, a.imie COLLATE NOCASE, a.id";
  const headBinds: unknown[] = [];
  if (p.sort === "status") {
    order = VERIFIED_FIRST + "a.status COLLATE NOCASE, a.nazwisko COLLATE NOCASE, a.id";
  } else if (p.sort === "miasto") {
    selectExtra = ", (SELECT json_extract(rp.value, '$.miasta[0]') FROM json_each(a.regiony) rp WHERE json_extract(rp.value, '$.woj') = ? LIMIT 1) AS primary_city";
    order = VERIFIED_FIRST + "primary_city COLLATE NOCASE, a.nazwisko COLLATE NOCASE, a.id";
    headBinds.push(p.woj); // bind for selectExtra (appears before WHERE binds)
  }

  const sql = `SELECT a.*${selectExtra} FROM advisors a WHERE ${whereSql} ORDER BY ${order} LIMIT ? OFFSET ?`;
  const { results } = await DB.prepare(sql).bind(...headBinds, ...whereBinds, p.limit, p.offset).all<Row>();
  return { items: (results ?? []).map(rowToAdvisor), total };
}

// ----- Admin CRUD -----

export async function getAdvisorById(id: string): Promise<Advisor | null> {
  const DB = await db();
  const row = await DB.prepare("SELECT * FROM advisors WHERE id = ?").bind(id).first<Row>();
  return row ? rowToAdvisor(row) : null;
}

export async function adminListAdvisors(): Promise<Advisor[]> {
  const DB = await db();
  const { results } = await DB.prepare(
    "SELECT * FROM advisors ORDER BY zweryfikowany DESC, nazwisko COLLATE NOCASE, imie COLLATE NOCASE, id"
  ).all<Row>();
  return (results ?? []).map(rowToAdvisor);
}

export async function createAdvisor(draft: Omit<Advisor, "id">): Promise<Advisor> {
  const DB = await db();
  const advisor: Advisor = { ...draft, id: "d" + crypto.randomUUID() };
  await insertStmt(DB, advisor).run();
  return advisor;
}

export async function updateAdvisor(a: Advisor): Promise<void> {
  const DB = await db();
  await DB.prepare(
    `UPDATE advisors SET
       imie = ?, nazwisko = ?, status = ?, zweryfikowany = ?, zdjecie = ?, regiony = ?,
       email = ?, telefon = ?, www = ?, specjalnosc = ?, oferta = ?,
       dataUprawnien = ?, dataDolaczenia = ?, dataWeryfikacji = ?, dataUtraty = ?
     WHERE id = ?`
  ).bind(
    a.imie, a.nazwisko, a.status, a.zweryfikowany ? 1 : 0, a.zdjecie, JSON.stringify(a.regiony),
    a.email, a.telefon, a.www, a.specjalnosc, a.oferta,
    a.dataUprawnien, a.dataDolaczenia, a.dataWeryfikacji, a.dataUtraty,
    a.id,
  ).run();
}

export async function removeAdvisor(id: string): Promise<void> {
  const DB = await db();
  await DB.prepare("DELETE FROM advisors WHERE id = ?").bind(id).run();
}
