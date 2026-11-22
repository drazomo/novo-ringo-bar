import type { Lang } from "./data";

export const ROUTES = {
  es: { home: "/", carta: "/carta" },
  en: { home: "/en", carta: "/en/menu" },
} as const;

export const T = {
  es: {
    locale: "es_ES",
    skip: "Saltar al contenido",
    navCarta: "Carta", navGallery: "Galería", navVisit: "Horario y contacto",
    order: "Pedir a domicilio", orderShort: "Pedir", call: "Llamar", directions: "Cómo llegar",
    statusFallback: "Horario",
    open: "Abierto · hasta las ", opens: "Abre hoy a las ", closedOpens: "Cerrado · abre ", tomorrow: "mañana", at: " a las ",
    away: "Cerrado por vacaciones", closedDay: "Cerrado", today: "Hoy",
    soldOut: "Agotado hoy",
    tags: { casa: "De la casa", top: "Favorita", picante: "Picante", nuevo: "Nuevo", sincarne: "Sin carne" } as Record<string, string>,
    glovo: "Pedir en Glovo", uber: "Pedir en Uber Eats", pickup: "Recoger: ",
    langSwitch: "English", langCode: "EN",
    footerNote: "Pizzería italiana en Campanar, València",
  },
  en: {
    locale: "en_GB",
    skip: "Skip to content",
    navCarta: "Menu", navGallery: "Gallery", navVisit: "Hours & contact",
    order: "Order delivery", orderShort: "Order", call: "Call", directions: "Directions",
    statusFallback: "Hours",
    open: "Open · until ", opens: "Opens today at ", closedOpens: "Closed · opens ", tomorrow: "tomorrow", at: " at ",
    away: "Closed for holidays", closedDay: "Closed", today: "Today",
    soldOut: "Sold out today",
    tags: { casa: "House special", top: "Favourite", picante: "Spicy", nuevo: "New", sincarne: "Meat-free" } as Record<string, string>,
    glovo: "Order on Glovo", uber: "Order on Uber Eats", pickup: "Pick-up: ",
    langSwitch: "Español", langCode: "ES",
    footerNote: "Italian pizzeria in Campanar, Valencia",
  },
} satisfies Record<Lang, unknown>;
