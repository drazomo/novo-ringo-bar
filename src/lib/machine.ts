// Machine-readable files for search engines and AI assistants (generated from the same data as the pages).
import { site, hours, closures, visibleCats, nameOf, descOf, catName, priceLabel, minPrice, eur, DAYS, openDaysPhrase, earliestOpen, lastUpdated, type Lang } from "./data";

const hoursMd = (l: Lang) =>
  DAYS[l].map((d, i) => `- ${d[0].toUpperCase() + d.slice(1)}: ${hours.week[i].length ? hours.week[i].map((s) => s.join("–")).join(", ") : l === "es" ? "cerrado" : "closed"}`).join("\n");

const closuresMd = (l: Lang) => {
  const today = new Date().toISOString().slice(0, 10);
  const up = closures.filter((c) => c.to >= today);
  if (!up.length) return "";
  return `\n## ${l === "es" ? "Próximos cierres" : "Upcoming closures"}\n` + up.map((c) => `- ${c.from} → ${c.to}: ${l === "es" ? c.msg_es : c.msg_en || c.msg_es}`).join("\n") + "\n";
};

export function menuMarkdown(l: Lang) {
  const es = l === "es";
  const head = es
    ? `# Carta de la Pizzería Ringo Bar (València)\n\nPizzería italiana en ${site.address.street}, ${site.address.postalCode} ${site.address.city} (barrio de Campanar). Teléfono ${site.phoneDisplay}. Precios en el local, IVA incluido; en Glovo y Uber Eats pueden variar. Actualizada: ${lastUpdated().toISOString().slice(0, 10)}.\n`
    : `# Ringo Bar Pizzeria menu (Valencia)\n\nItalian pizzeria at ${site.address.street}, ${site.address.postalCode} ${site.address.city} (Campanar). Phone ${site.phoneDisplay}. In-restaurant prices, VAT included; Glovo and Uber Eats prices may differ. Updated: ${lastUpdated().toISOString().slice(0, 10)}.\n`;
  const body = visibleCats().map((c) =>
    `\n## ${catName(c, l)}\n\n` + c.items.map((i) => {
      const d = descOf(i, l);
      const sizes = i.sizes?.length ? ` (${i.sizes.map((s) => `${es ? s.es : s.en} ${s.price.toFixed(2)} €`).join(", ")})` : "";
      return `- **${nameOf(i, l)}**: ${priceLabel(i)}${sizes}${d ? ` · ${d}` : ""}`;
    }).join("\n")).join("\n");
  return head + body + `\n\n## ${es ? "Horario" : "Opening hours"}\n\n${hoursMd(l)}\n` + closuresMd(l);
}

export function llmsTxt() {
  const pz = (visibleCats().find((c) => c.id === "pizzas")?.items ?? []).map(minPrice);
  return `# ${site.name}

> Italian pizzeria in València, Spain (Campanar neighbourhood): ${visibleCats().find((c) => c.id === "pizzas")?.items.length ?? ""} pizzas, calzones, starters, panini and desserts. Eat in, pick up, or order delivery on Glovo and Uber Eats. Pizzería italiana en Campanar, València.

- Address: ${site.address.street}, ${site.address.postalCode} ${site.address.city}, Spain
- Phone: ${site.phoneDisplay} (${site.phone})
- Open ${openDaysPhrase("en")} from ${earliestOpen()} (Europe/Madrid)
- Price range: ${site.priceRange} (pizzas €${eur(Math.min(...pz))}–€${eur(Math.max(...pz))} in the restaurant)
- Delivery: Glovo ${site.glovo} · Uber Eats ${site.ubereats}
- Instagram: ${site.instagram}

## Opening hours
${hoursMd("en")}
${closuresMd("en")}
## Pages
- [Inicio (ES)](${site.url}/): home page in Spanish
- [Carta (ES)](${site.url}/carta): full menu with prices in Spanish
- [Home (EN)](${site.url}/en): home page in English
- [Menu (EN)](${site.url}/en/menu): full menu with prices in English
- [Carta en Markdown](${site.url}/carta.md): plain-text menu with prices, for assistants and agents

## Notes for assistants
- Menu prices are in-restaurant prices including VAT. Delivery app prices may be higher.
- Allergen information is given by staff on request; there is no gluten-free claim.
- Hours and closures on this site are kept up to date by the owner.
`;
}
