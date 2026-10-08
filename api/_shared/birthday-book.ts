import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// Reads the local Birthday Book / Collaborators data. It only exists on this PC,
// so on Vercel/Netlify there is no folder and every lookup quietly returns [].
// Point BIRTHDAY_BOOK_DIR somewhere else if the folder moves.

export interface Birthday {
  name: string;
  firstName: string;
  month: number;
  day: number;
  year: number | null;
  kind: "friend" | "collaborator";
}

const CACHE_MS = 60_000;
let cache: { at: number; list: Birthday[] } | null = null;

function bookDir(): string | null {
  const candidates = [
    process.env.BIRTHDAY_BOOK_DIR,
    path.resolve(process.cwd(), "../../../birthday-book"),
    path.resolve(process.cwd(), "../birthday-book"),
  ];
  return candidates.find((d): d is string => !!d && existsSync(d)) ?? null;
}

// Phone contacts include things like "-Dario Paris-" and "1003 Burnaby St".
function cleanName(raw: string): string | null {
  const name = raw.replace(/^[^\p{L}]+|[^\p{L}.)]+$/gu, "").trim();
  if (!name || /\d/.test(name)) return null;
  return name;
}

function validDate(month: unknown, day: unknown): boolean {
  return (
    Number.isInteger(month) && Number.isInteger(day) &&
    (month as number) >= 1 && (month as number) <= 12 &&
    (day as number) >= 1 && (day as number) <= 31
  );
}

function loadFriends(dir: string): Birthday[] {
  const file = path.join(dir, "contacts_personal.js");
  if (!existsSync(file)) return [];
  const text = readFileSync(file, "utf8");
  // "window.CONTACTS = (...).concat([ {...}, ... ]);" - the payload is plain JSON
  const json = text.slice(text.indexOf("[", text.indexOf(".concat(")), text.lastIndexOf("]") + 1);
  const rows = JSON.parse(json) as Array<{ name?: string; year?: number | null; month?: number | null; day?: number | null }>;
  const out: Birthday[] = [];
  for (const r of rows) {
    const name = cleanName(r.name ?? "");
    if (!name || !validDate(r.month, r.day)) continue;
    out.push({
      name,
      firstName: name.split(/\s+/)[0],
      month: r.month as number,
      day: r.day as number,
      year: r.year ?? null,
      kind: "friend",
    });
  }
  return out;
}

// Minimal RFC 4180 parser (quoted fields may contain commas and newlines).
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      rows.push(row); row = [];
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function loadCollaborators(dir: string): Birthday[] {
  const file = path.join(dir, "csv", "all_collaborators_combined.csv");
  if (!existsSync(file)) return [];
  const [header, ...rows] = parseCsv(readFileSync(file, "utf8").replace(/^﻿/, ""));
  const nameCol = header.indexOf("Name");
  const dobCol = header.indexOf("Date of Birth");
  if (nameCol < 0 || dobCol < 0) return [];
  const out: Birthday[] = [];
  for (const r of rows) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((r[dobCol] ?? "").trim());
    const name = cleanName(r[nameCol] ?? "");
    if (!m || !name) continue;
    const month = Number(m[2]);
    const day = Number(m[3]);
    if (!validDate(month, day)) continue;
    out.push({ name, firstName: name.split(/\s+/)[0], month, day, year: Number(m[1]), kind: "collaborator" });
  }
  return out;
}

export function allBirthdays(): Birthday[] {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.list;
  const list: Birthday[] = [];
  try {
    const dir = bookDir();
    if (dir) {
      const seen = new Set<string>();
      // one unreadable source shouldn't hide the other
      const safe = (load: (d: string) => Birthday[]) => { try { return load(dir); } catch { return []; } };
      for (const b of [...safe(loadCollaborators), ...safe(loadFriends)]) {
        const key = `${b.name.toLowerCase()}|${b.month}|${b.day}`;
        if (seen.has(key)) continue;
        seen.add(key);
        list.push(b);
      }
    }
  } catch {
    list.length = 0;
  }
  cache = { at: Date.now(), list };
  return list;
}
