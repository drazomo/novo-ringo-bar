// Validated edits for Panel Ringo. Each edit returns the files to write and a change record
// holding the previous value of exactly what changed, so "Deshacer" restores only that.
import crypto from "node:crypto";
import type { Item, Category, Closure, Shift, Size } from "../data";

export const FILES = { menu: "src/data/menu.json", hours: "src/data/hours.json", closures: "src/data/closures.json", changes: "src/data/changes.json" } as const;
export type Menu = { categories: Category[]; items: Item[] };
export type Hours = { week: Shift[][] };
export type Change = {
  id: string; at: string; who: string; summary: string;
  kind: "item" | "categories" | "hours" | "closure";
  target: string | null;     // item id / closure id
  before: unknown;           // previous value (null = did not exist)
  index?: number;            // original position for deleted items
};
export type State = { menu: Menu; hours: Hours; closures: Closure[]; changes: Change[] };

export class Invalid extends Error {}
const must = (ok: unknown, msg: string) => { if (!ok) throw new Invalid(msg); };
const TAGS = ["casa", "top", "picante", "nuevo", "sincarne"];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
export const todayMadrid = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
const str = (v: unknown, max: number, field: string, required = false) => {
  const s = typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
  must(!required || s.length > 0, `Falta: ${field}`);
  must(s.length <= max, `${field}: máximo ${max} caracteres`);
  return s;
};
const money = (v: unknown, field: string) => {
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : Number(v);
  must(Number.isFinite(n) && n >= 0 && n < 1000, `${field}: precio no válido`);
  return Math.round(n * 100) / 100;
};
const slug = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "plato";
const uniq = (base: string, taken: Set<string>) => { let id = base, k = 2; while (taken.has(id)) id = `${base}-${k++}`; return id; };
const eur = (n: number | null | undefined) => (n == null ? "–" : n.toLocaleString("es-ES", { minimumFractionDigits: 2 }) + " €");
const plabel = (i: Item) => i.sizes?.length ? i.sizes.map((z) => `${z.es} ${eur(z.price)}`).join(", ") : i.priceMax ? `${eur(i.price)}–${eur(i.priceMax)}` : eur(i.price);

function record(s: State, who: string, c: Omit<Change, "id" | "at" | "who">) {
  const ch: Change = { id: crypto.randomBytes(5).toString("hex"), at: new Date().toISOString(), who, ...c };
  s.changes = [ch, ...s.changes].slice(0, 40);
  return ch;
}

export function cleanItem(raw: Record<string, unknown>, s: State, existing?: Item): Item {
  const name = str(raw.name, 80, "Nombre", true);
  const cat = str(raw.cat, 40, "Categoría", true);
  must(s.menu.categories.some((c) => c.id === cat), "Categoría no válida");
  const sizes: Size[] = Array.isArray(raw.sizes) ? (raw.sizes as Record<string, unknown>[]).slice(0, 6).map((z) => ({
    es: str(z.es, 30, "Tamaño", true), en: str(z.en, 30, "Size") || str(z.es, 30, "Tamaño"), price: money(z.price, "Precio del tamaño"),
  })) : [];
  const price = sizes.length ? null : money(raw.price, "Precio");
  const priceMax = !sizes.length && raw.priceMax !== "" && raw.priceMax != null ? money(raw.priceMax, "Precio hasta") : null;
  must(priceMax == null || (price != null && priceMax > price), "«Hasta» debe ser mayor que el precio");
  const tags = Array.isArray(raw.tags) ? [...new Set((raw.tags as string[]).filter((t) => TAGS.includes(t)))] : [];
  const status = raw.status === "off" ? "off" : "on";
  const soldOutOn = raw.soldOut === true ? todayMadrid() : raw.soldOut === false ? null : (existing?.soldOutOn ?? null);
  const taken = new Set(s.menu.items.map((i) => i.id));
  if (existing) taken.delete(existing.id);
  return {
    id: existing?.id ?? uniq(slug(name), taken),
    cat, name,
    name_en: str(raw.name_en, 80, "English name") || name,
    desc: str(raw.desc, 400, "Ingredientes"),
    desc_en: str(raw.desc_en, 400, "English ingredients"),
    price, ...(priceMax != null ? { priceMax } : {}), ...(sizes.length ? { sizes } : {}),
    tags, status, soldOutOn,
    photo: typeof raw.photo === "string" && /^[a-z0-9-]+\.(jpg|png|webp)$/.test(raw.photo) ? raw.photo : (existing?.photo ?? null),
  };
}

export function saveItem(s: State, who: string, raw: Record<string, unknown>) {
  const id = typeof raw.id === "string" ? raw.id : null;
  const idx = id ? s.menu.items.findIndex((i) => i.id === id) : -1;
  const before = idx >= 0 ? s.menu.items[idx] : null;
  must(!id || before, "Ese plato ya no existe. Recarga la página.");
  const it = cleanItem(raw, s, before ?? undefined);
  let summary: string;
  if (!before) {
    // new items go to the end of their category
    const last = s.menu.items.map((i) => i.cat).lastIndexOf(it.cat);
    s.menu.items.splice(last + 1, 0, it);
    summary = `Nuevo plato: ${it.name} (${plabel(it)})`;
  } else {
    s.menu.items[idx] = it;
    const diffs: string[] = [];
    if (before.name !== it.name) diffs.push(`nombre «${before.name}» → «${it.name}»`);
    if (before.price !== it.price || before.priceMax !== it.priceMax || JSON.stringify(before.sizes) !== JSON.stringify(it.sizes)) diffs.push(`precio ${plabel(before)} → ${plabel(it)}`);
    if (before.desc !== it.desc) diffs.push("ingredientes");
    if (before.cat !== it.cat) diffs.push("categoría");
    if (before.status !== it.status) diffs.push(it.status === "off" ? "oculto" : "visible otra vez");
    if (before.soldOutOn !== it.soldOutOn) diffs.push(it.soldOutOn ? "agotado hoy" : "disponible");
    if (before.photo !== it.photo) diffs.push("foto");
    if (JSON.stringify(before.tags) !== JSON.stringify(it.tags)) diffs.push("etiquetas");
    if (before.name_en !== it.name_en || before.desc_en !== it.desc_en) diffs.push("inglés");
    if (!diffs.length) throw new Invalid("No has cambiado nada.");
    summary = `${it.name}: ${diffs.join(", ")}`;
  }
  return { item: it, change: record(s, who, { summary, kind: "item", target: it.id, before }), files: ["menu"] as const };
}

export function deleteItem(s: State, who: string, id: string) {
  const idx = s.menu.items.findIndex((i) => i.id === id);
  must(idx >= 0, "Ese plato ya no existe.");
  const [before] = s.menu.items.splice(idx, 1);
  return { change: record(s, who, { summary: `Eliminado: ${before.name}`, kind: "item", target: id, before, index: idx }), files: ["menu"] as const };
}

export function saveCategories(s: State, who: string, raw: unknown) {
  must(Array.isArray(raw) && raw.length > 0 && raw.length <= 20, "Lista de categorías no válida");
  const before = s.menu.categories;
  const taken = new Set<string>();
  const cats: Category[] = (raw as Record<string, unknown>[]).map((c) => {
    const es = str(c.es, 40, "Nombre de la categoría", true);
    const id = typeof c.id === "string" && before.some((b) => b.id === c.id) ? c.id : uniq(slug(es), new Set([...before.map((b) => b.id), ...taken]));
    taken.add(id);
    return { id, es, en: str(c.en, 40, "English") || es, visible: c.visible !== false };
  });
  const removed = before.filter((b) => !cats.some((c) => c.id === b.id));
  for (const r of removed) must(!s.menu.items.some((i) => i.cat === r.id), `«${r.es}» tiene platos: muévelos antes de borrarla`);
  s.menu.categories = cats;
  return { change: record(s, who, { summary: "Categorías actualizadas", kind: "categories", target: null, before }), files: ["menu"] as const };
}

export function saveHours(s: State, who: string, raw: unknown) {
  must(Array.isArray(raw) && raw.length === 7, "Horario no válido");
  const week = (raw as unknown[][]).map((day) => {
    must(Array.isArray(day) && day.length <= 3, "Horario no válido");
    return (day as unknown[][]).map((sh) => {
      must(Array.isArray(sh) && sh.length === 2 && TIME.test(String(sh[0])) && TIME.test(String(sh[1])), "Hora no válida");
      return [String(sh[0]), String(sh[1])] as Shift;
    });
  });
  const before = s.hours.week;
  s.hours = { week };
  return { change: record(s, who, { summary: "Horario semanal actualizado", kind: "hours", target: null, before }), files: ["hours"] as const };
}

export function saveClosure(s: State, who: string, raw: Record<string, unknown>) {
  const from = String(raw.from || ""), to = String(raw.to || "");
  must(DATE.test(from) && DATE.test(to) && from <= to, "Fechas no válidas");
  must(to >= todayMadrid(), "Ese cierre ya ha pasado");
  const id = typeof raw.id === "string" && s.closures.some((c) => c.id === raw.id) ? raw.id : crypto.randomBytes(4).toString("hex");
  const before = s.closures.find((c) => c.id === id) ?? null;
  const c: Closure = {
    id, from, to,
    reason: ["vacaciones", "festivo", "otro"].includes(String(raw.reason)) ? String(raw.reason) : "otro",
    msg_es: str(raw.msg_es, 220, "Mensaje", true),
    msg_en: str(raw.msg_en, 220, "English message"),
  };
  s.closures = [...s.closures.filter((x) => x.id !== id), c].sort((a, b) => a.from.localeCompare(b.from));
  return { closure: c, change: record(s, who, { summary: `Cierre ${from} → ${to}`, kind: "closure", target: id, before }), files: ["closures"] as const };
}

export function deleteClosure(s: State, who: string, id: string) {
  const before = s.closures.find((c) => c.id === id);
  must(before, "Ese cierre ya no existe.");
  s.closures = s.closures.filter((c) => c.id !== id);
  return { change: record(s, who, { summary: `Cierre anulado: ${before!.from} → ${before!.to}`, kind: "closure", target: id, before }), files: ["closures"] as const };
}

export function undo(s: State, who: string, changeId: string) {
  const ch = s.changes.find((c) => c.id === changeId);
  must(ch, "Ese cambio ya no está en el historial.");
  const c = ch!;
  if (c.kind === "item") {
    const idx = s.menu.items.findIndex((i) => i.id === c.target);
    const current = idx >= 0 ? s.menu.items[idx] : null;
    if (c.before == null) { if (idx >= 0) s.menu.items.splice(idx, 1); }
    else if (idx >= 0) s.menu.items[idx] = c.before as Item;
    else s.menu.items.splice(Math.min(c.index ?? s.menu.items.length, s.menu.items.length), 0, c.before as Item);
    return { change: record(s, who, { summary: `Deshecho: ${c.summary}`, kind: "item", target: c.target, before: current, index: idx >= 0 ? idx : undefined }), files: ["menu"] as const };
  }
  if (c.kind === "categories") {
    const current = s.menu.categories;
    const cats = c.before as Category[];
    // keep categories that items still use
    for (const used of new Set(s.menu.items.map((i) => i.cat))) if (!cats.some((x) => x.id === used)) { const cur = current.find((x) => x.id === used); if (cur) cats.push(cur); }
    s.menu.categories = cats;
    return { change: record(s, who, { summary: `Deshecho: ${c.summary}`, kind: "categories", target: null, before: current }), files: ["menu"] as const };
  }
  if (c.kind === "hours") {
    const current = s.hours.week;
    s.hours = { week: c.before as Shift[][] };
    return { change: record(s, who, { summary: `Deshecho: ${c.summary}`, kind: "hours", target: null, before: current }), files: ["hours"] as const };
  }
  const current = s.closures.find((x) => x.id === c.target) ?? null;
  s.closures = s.closures.filter((x) => x.id !== c.target);
  if (c.before) s.closures = [...s.closures, c.before as Closure].sort((a, b) => a.from.localeCompare(b.from));
  return { change: record(s, who, { summary: `Deshecho: ${c.summary}`, kind: "closure", target: c.target, before: current }), files: ["closures"] as const };
}
