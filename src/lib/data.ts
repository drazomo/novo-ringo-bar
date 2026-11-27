// Single source of truth for the public site: everything comes from src/data/*.json,
// which Panel Ringo edits (via GitHub commits) and Vercel rebuilds from.
import menuJson from "../data/menu.json";
import hoursJson from "../data/hours.json";
import closuresJson from "../data/closures.json";
import siteJson from "../data/site.json";
import changesJson from "../data/changes.json";
import type { ImageMetadata } from "astro";

export type Lang = "es" | "en";
export type Size = { es: string; en: string; price: number };
export type Item = {
  id: string; cat: string; name: string; name_en: string; desc: string; desc_en: string;
  price: number | null; priceMax?: number | null; sizes?: Size[];
  tags: string[]; status: "on" | "off"; soldOutOn: string | null; photo: string | null;
};
export type Category = { id: string; es: string; en: string; visible: boolean };
export type Closure = { id: string; from: string; to: string; reason: string; msg_es: string; msg_en: string };
export type Shift = [string, string];

export const site = siteJson;
export const menu = menuJson as { categories: Category[]; items: Item[] };
export const hours = hoursJson as { week: Shift[][] };
export const closures = closuresJson as Closure[];
export const changes = changesJson as { at: string }[];

const photos = import.meta.glob<{ default: ImageMetadata }>("../assets/menu/*.{jpg,jpeg,png,webp}", { eager: true });
export const photoOf = (it: Item): ImageMetadata | null => {
  if (!it.photo) return null;
  const hit = Object.entries(photos).find(([p]) => p.endsWith("/" + it.photo));
  return hit ? hit[1].default : null;
};

export const visibleCats = () =>
  menu.categories.filter((c) => c.visible).map((c) => ({ ...c, items: menu.items.filter((i) => i.cat === c.id && i.status !== "off") }))
    .filter((c) => c.items.length);

export const nameOf = (i: Item, l: Lang) => (l === "en" ? i.name_en || i.name : i.name);
export const descOf = (i: Item, l: Lang) => (l === "en" ? i.desc_en || "" : i.desc || "");
export const catName = (c: Category, l: Lang) => (l === "en" ? c.en || c.es : c.es);

const num = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const priceLabel = (i: Item) => {
  if (i.sizes?.length) {
    const ps = i.sizes.map((s) => s.price);
    return Math.min(...ps) === Math.max(...ps) ? `${num(ps[0])} €` : `${num(Math.min(...ps))} – ${num(Math.max(...ps))} €`;
  }
  if (i.price == null) return "";
  return i.priceMax && i.priceMax > i.price ? `${num(i.price)} – ${num(i.priceMax)} €` : `${num(i.price)} €`;
};
export const minPrice = (i: Item) => (i.sizes?.length ? Math.min(...i.sizes.map((s) => s.price)) : i.price ?? 0);
export const eur = num;

export const DAYS = {
  es: ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
};
const SCHEMA_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const schemaDay = (i: number) => SCHEMA_DAYS[i];

/** "de martes a domingo" style summary of the open days. */
export function openDaysPhrase(l: Lang) {
  const open = hours.week.map((s) => s.length > 0);
  const D = DAYS[l];
  const idx = open.map((o, i) => (o ? i : -1)).filter((i) => i >= 0);
  if (!idx.length) return "";
  if (idx.length === 7) return l === "es" ? "todos los días" : "every day";
  const contiguous = idx.every((v, k) => k === 0 || v === idx[k - 1] + 1);
  if (contiguous) return l === "es" ? `de ${D[idx[0]]} a ${D[idx.at(-1)!]}` : `${D[idx[0]]} to ${D[idx.at(-1)!]}`;
  return idx.map((i) => D[i]).join(", ");
}
export const earliestOpen = () => hours.week.flat().map((s) => s[0]).sort()[0] || "";

const listJoin = (xs: string[], l: Lang) => xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} ${l === "es" ? "y" : "and"} ${xs.at(-1)}`;

/** The usual opening time: the shift start shared by the most open days (ties → the later one, i.e. the evening). */
export function mainOpen() {
  const n = new Map<string, number>();
  for (const day of hours.week) for (const s of new Set(day.map((x) => x[0]))) n.set(s, (n.get(s) ?? 0) + 1);
  return [...n].sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0]))[0]?.[0] ?? "";
}

/**
 * Honest one-line hours summary, e.g.
 * "de martes a sábado desde las 19:00 (viernes y sábado, también de 13:00 a 15:30)".
 * Using the earliest time of the week ("desde las 13:00") misleads when only some days open at lunch.
 */
export function hoursSummary(l: Lang) {
  const days = openDaysPhrase(l), from = mainOpen();
  if (!days) return "";
  const D = DAYS[l], extra = new Map<string, number[]>();
  hours.week.forEach((day, i) => {
    if (!day.length) return;
    const others = day.some((s) => s[0] === from) ? day.filter((s) => s[0] !== from) : day;
    for (const [a, b] of others) { const k = `${a}|${b}`; extra.set(k, [...(extra.get(k) ?? []), i]); }
  });
  const notes = [...extra].map(([k, idx]) => {
    const [a, b] = k.split("|"), who = listJoin(idx.map((i) => D[i]), l);
    return l === "es" ? `${who}, también de ${a} a ${b}` : `${who} also ${a}–${b}`;
  });
  const base = l === "es" ? `${days} desde las ${from}` : `${days} from ${from}`;
  return notes.length ? `${base} (${notes.join("; ")})` : base;
}

export const lastUpdated = () => {
  const d = changes.length ? changes[0].at : null;
  return d ? new Date(d) : new Date();
};
export const fmtDate = (d: Date, l: Lang) =>
  d.toLocaleDateString(l === "es" ? "es-ES" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" });
