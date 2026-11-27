// @ts-check
// TBH site engine. Deploy target is chosen at build time:
//   DEPLOY_TARGET=cloudflare (default)  → Cloudflare Workers (static assets + panel API Worker)
//   DEPLOY_TARGET=vercel                → Vercel (legacy; sites not yet migrated)
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

const target = process.env.DEPLOY_TARGET || (process.env.VERCEL ? "vercel" : "cloudflare"); // Vercel builds keep working during the move
const adapter =
  target === "vercel"
    ? (await import("@astrojs/vercel")).default({ webAnalytics: { enabled: true } })
    : (await import("@astrojs/cloudflare")).default({ imageService: "compile", prerenderEnvironment: "node" }); // pages + images built in Node (sharp, qrcode); only the panel API runs in the Worker

export default defineConfig({
  site: process.env.SITE_URL || "https://www.ringopizzeria.com",
  output: "static", // every public page is prerendered HTML; only /api/panel/* runs on demand
  adapter,
  session: false, // the panel uses its own signed cookie; no Astro sessions/KV needed
  trailingSlash: "never",
  build: { inlineStylesheets: "always" }, // no render-blocking CSS request
  // Old URLs from the client's previous site
  redirects: { "/hacer-pedido": "/#pedir", "/pedir-a-ringo": "/#pedir" },
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/panel") && !page.includes("/404"),
      i18n: { defaultLocale: "es", locales: { es: "es-ES", en: "en-GB" } },
    }),
  ],
});
