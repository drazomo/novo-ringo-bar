// Validates src/data/*.json shapes. Usage: npm run check:data
import fs from "node:fs";
const read = (f) => JSON.parse(fs.readFileSync(new URL(`../src/data/${f}`, import.meta.url)));
const errs = [];
const menu = read("menu.json"), hours = read("hours.json"), closures = read("closures.json");
const cats = new Set(menu.categories.map((c) => c.id));
const ids = new Set();
for (const i of menu.items) {
  if (ids.has(i.id)) errs.push(`duplicate item id ${i.id}`); ids.add(i.id);
  if (!cats.has(i.cat)) errs.push(`${i.id}: unknown category ${i.cat}`);
  if (!i.name) errs.push(`${i.id}: missing name`);
  if (!(i.sizes?.length) && typeof i.price !== "number") errs.push(`${i.id}: price must be a number`);
  if (i.photo && !fs.existsSync(new URL(`../src/assets/menu/${i.photo}`, import.meta.url))) errs.push(`${i.id}: photo file missing ${i.photo}`);
}
if (!Array.isArray(hours.week) || hours.week.length !== 7) errs.push("hours.week must have 7 days");
for (const d of hours.week) for (const s of d) if (!/^\d\d:\d\d$/.test(s[0]) || !/^\d\d:\d\d$/.test(s[1])) errs.push(`bad time ${s}`);
for (const c of closures) if (!(c.from <= c.to)) errs.push(`closure ${c.id}: from > to`);
console.log(errs.length ? errs.join("\n") : `OK: ${menu.items.length} items, ${menu.categories.length} categories, ${closures.length} closures`);
process.exit(errs.length ? 1 : 0);
