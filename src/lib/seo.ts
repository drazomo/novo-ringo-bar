// JSON-LD builders. Everything is generated from the same data the pages render,
// so structured data can never drift from the visible content.
import { site, hours, closures, visibleCats, nameOf, descOf, catName, minPrice, schemaDay, type Lang } from "./data";
import { ROUTES } from "./i18n";

const abs = (p: string) => new URL(p, site.url).href;
export const RESTAURANT_ID = abs("/#restaurant");

export function restaurant(l: Lang, imageUrl: string, logoUrl: string) {
  const today = new Date().toISOString().slice(0, 10);
  const ohs = hours.week.flatMap((shifts, d) =>
    shifts.map(([opens, closes]) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: `https://schema.org/${schemaDay(d)}`, opens, closes })));
  const special = closures.filter((c) => c.to >= today).map((c) => ({
    "@type": "OpeningHoursSpecification", opens: "00:00", closes: "00:00", validFrom: c.from, validThrough: c.to,
  }));
  return {
    "@type": "Restaurant",
    "@id": RESTAURANT_ID,
    name: site.name,
    alternateName: ["Pizzeria Ringo", "Ringo Bar", "Pizzería Ringo Bar", "Ringo Pizzeria y Panini Italiani"],
    url: site.url + "/",
    image: [imageUrl],
    logo: logoUrl,
    telephone: site.phone,
    priceRange: site.priceRange,
    servesCuisine: l === "es" ? ["Italiana", "Pizza"] : ["Italian", "Pizza"],
    address: {
      "@type": "PostalAddress", streetAddress: site.address.street, postalCode: site.address.postalCode,
      addressLocality: site.address.city, addressRegion: site.address.region, addressCountry: site.address.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng },
    hasMap: site.maps,
    openingHoursSpecification: ohs,
    ...(special.length ? { specialOpeningHoursSpecification: special } : {}),
    hasMenu: abs(ROUTES[l].carta),
    sameAs: [site.instagram, site.facebook, site.glovo],
    potentialAction: { "@type": "OrderAction", target: [site.glovo] },
  };
}

export function menuSchema(l: Lang) {
  return {
    "@type": "Menu",
    "@id": abs(ROUTES[l].carta) + "#menu",
    name: l === "es" ? "Carta de la Pizzería Ringo" : "Pizzería Ringo menu",
    inLanguage: l,
    url: abs(ROUTES[l].carta),
    hasMenuSection: visibleCats().map((c) => ({
      "@type": "MenuSection",
      name: catName(c, l),
      hasMenuItem: c.items.map((i) => ({
        "@type": "MenuItem",
        name: nameOf(i, l),
        ...(descOf(i, l) ? { description: descOf(i, l) } : {}),
        offers: { "@type": "Offer", price: minPrice(i).toFixed(2), priceCurrency: "EUR" },
      })),
    })),
  };
}

export const breadcrumbs = (items: [string, string][]) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], k) => ({ "@type": "ListItem", position: k + 1, name, item: abs(path) })),
});

export const website = (l: Lang) => ({
  "@type": "WebSite", "@id": abs("/#website"), url: site.url + "/", name: site.name, inLanguage: l, publisher: { "@id": RESTAURANT_ID },
});

export const faq = (qa: [string, string][]) => ({
  "@type": "FAQPage",
  mainEntity: qa.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
});

export const graph = (...nodes: object[]) => JSON.stringify({ "@context": "https://schema.org", "@graph": nodes });
