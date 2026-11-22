// One-off import of the old Sanity data (project tf5jy7b0) into src/data/*.json + src/assets/menu/.
// Kept for the record. Re-running OVERWRITES src/data/menu.json and src/data/hours.json.
// Usage: node scripts/migrate-from-sanity.mjs
import fs from "node:fs/promises";
import path from "node:path";

const API = "https://tf5jy7b0.apicdn.sanity.io/v2021-10-21/data/query/production";
const q = async (query) => (await (await fetch(`${API}?query=${encodeURIComponent(query)}`)).json()).result;

const EMOJI = /[\u2600-\u27BF\u2B00-\u2BFF\u{1F300}-\u{1FAFF}\uFE0F]/gu;
const clean = (s) => (s || "").replace(EMOJI, "").replace(/\s+/g, " ").trim();
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : "");
const slug = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Fixes for data errors found in the audit (22 Nov 2026).
const FIX = {
  "Calzone York y Champiñones": { name_en: "Ham & Mushroom Calzone" },
  "Atún": { desc: "Base de tomate, mozzarella, atún y cebolla.", desc_en: "Tomato sauce, mozzarella, tuna and onion." },
  "Botella de agua": { name: "Agua", name_en: "Water", desc: "", desc_en: "", price: null,
    sizes: [{ es: "Pequeña", en: "Small", price: 1.5 }, { es: "Grande", en: "Large", price: 2.6 }, { es: "Con gas", en: "Sparkling", price: 2 }] },
  "Cafés": { name_en: "Coffee", desc: "Solo, cortado, con leche…", desc_en: "Espresso, cortado, latte…", price: 1.3, priceMax: 2 },
  "Cerveza (Tercio)": { name: "Cerveza (tercio)", desc: "", desc_en: "", price: 2.7, priceMax: 3 },
  "Refrescos": { desc: "Coca-Cola, Fanta, Aquarius, tónica, Fuze Tea.", desc_en: "Coca-Cola, Fanta, Aquarius, tonic, Fuze Tea." },
  "Copas Combinadas": { name: "Copas combinadas", desc: "Gin tonic y combinados.", desc_en: "Gin & tonic and mixed drinks." },
  "Copa de Vino": { name: "Copa de vino", name_en: "Glass of wine" },
  "Copas (whisky, ron, etc.)": { name_en: "Spirits (whisky, rum, etc.)", desc_en: "" },
  "Embutidos / Carne / Otros.": { name: "Embutidos, carne u otros", name_en: "Cured meats, meat or other" },
  "Mozzarella de Búfala, Burrata": { name: "Mozzarella de búfala o burrata", name_en: "Buffalo mozzarella or burrata" },
  "Vegetales / Verduras": { name: "Verduras", name_en: "Vegetables" },
  "Pizza Doble Masa": { name: "Pizza doble masa", name_en: "Double dough" },
  "Patatas Fritas": { name: "Patatas fritas", name_en: "Fries" },
  "Stick Mozzarella": { name: "Mozzarella sticks", desc: "7 unidades.", desc_en: "7 pieces." },
  "Nuggets de Pollo": { name: "Nuggets de pollo" },
  "Tequeños de Queso": { name: "Tequeños de queso", name_en: "Cheese tequeños" },
};
const TAGS = { "Ringo": ["casa"], "Burrata": ["top"], "Trufada": ["top"], "Salami Picante": ["picante"], "Panino Salami Picante": ["picante"] };
const MEAT = /jam[oó]n|bacon|panceta|pancetta|salami|longaniza|pollo|at[uú]n|anchoa|york|carne|embutido|nugget/i;

const CATS = [
  ["pizzas", "Pizzas", "Pizzas"], ["calzones", "Calzones", "Calzones"], ["entrantes", "Entrantes", "Starters"],
  ["bocadillos", "Paninis", "Panini"], ["postres", "Postres", "Desserts"], ["bebidas", "Bebidas", "Drinks"], ["extras", "Extras", "Extras"],
];

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const docs = await q('*[_type=="carta"]');
const [hor] = await q('*[_type=="horarios"]');
await fs.mkdir(path.join(root, "src/assets/menu"), { recursive: true });

const items = [];
for (const d of docs) {
  if (d.tipo === "promociones") continue; // placeholders with price 0
  const raw = d.nombre;
  let name = clean(raw);
  let cat = d.tipo;
  if (cat === "pizzas" && /^calzone/i.test(name)) cat = "calzones";
  const it = {
    id: slug(name),
    cat,
    name,
    name_en: clean(d.eng_name) || name,
    desc: cap(clean(d.descripcion)),
    desc_en: cap(clean(d.eng_descripcion)),
    price: d.precio,
    tags: [...(TAGS[name] || [])],
    status: "on",
    soldOutOn: null,
    photo: null,
    ...(FIX[raw] || FIX[name] || {}),
  };
  it.id = slug(it.name);
  if ((cat === "pizzas" || cat === "calzones") && !MEAT.test(it.desc + " " + it.name)) it.tags.push("sincarne");
  if (d.foto?.asset?._ref) {
    const [, id, dims, ext] = d.foto.asset._ref.split("-");
    const url = `https://cdn.sanity.io/images/tf5jy7b0/production/${id}-${dims}.${ext}?w=1600&fit=max`;
    const file = `${it.id}.${ext === "png" ? "png" : "jpg"}`;
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    await fs.writeFile(path.join(root, "src/assets/menu", file), buf);
    it.photo = file;
  }
  items.push(it);
}
const order = Object.fromEntries(CATS.map(([id], i) => [id, i]));
items.sort((a, b) => order[a.cat] - order[b.cat] || b.tags.includes("casa") - a.tags.includes("casa") || b.tags.includes("top") - a.tags.includes("top") || (a.price ?? 0) - (b.price ?? 0) || a.name.localeCompare(b.name, "es"));

const menu = { categories: CATS.map(([id, es, en]) => ({ id, es, en, visible: true })), items };
const DAY = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const fmt = (h) => `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 100)).padStart(2, "0")}`;
const week = DAY.map((day) => { const d = hor.dias.find((x) => x.day === day); return d && d.abierto ? [[fmt(d.horaInicio), fmt(d.horaCierre)]] : []; });

await fs.writeFile(path.join(root, "src/data/menu.json"), JSON.stringify(menu, null, 2) + "\n");
await fs.writeFile(path.join(root, "src/data/hours.json"), JSON.stringify({ week }, null, 2) + "\n");
console.log(items.length, "items,", items.filter((i) => i.photo).length, "photos; hours", JSON.stringify(week));
