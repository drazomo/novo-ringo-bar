// @ts-check
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://www.ringopizzeria.com",
  output: "static", // every public page is prerendered HTML; only /api/panel/* runs on demand
  adapter: vercel({ webAnalytics: { enabled: true } }),
  trailingSlash: "never",
  build: { inlineStylesheets: "always" }, // no render-blocking CSS request
  // Old Next.js URLs from the 2023 site
  redirects: { "/hacer-pedido": "/#pedir", "/pedir-a-ringo": "/#pedir" },
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/panel") && !page.includes("/404"),
      i18n: { defaultLocale: "es", locales: { es: "es-ES", en: "en-GB" } },
    }),
  ],
});
