# HANDOFF: Ringo Bar v3 (read this before changing anything)

Last updated: 22 Nov 2026, by Hermy (TBH) for Mark Rasavong.

## Status
- Branch **`v3`**: complete Astro rebuild of the site plus the owner panel. Built and tested locally:
  - 20/20 panel end-to-end checks passed
  - Lighthouse on mobile: Performance 95–97, Accessibility 100, SEO 100
- `main`: still the 2023 Next.js + Sanity site that runs ringopizzeria.com today. Nothing goes live until v3 is merged.
- The Sanity data was imported once (`scripts/migrate-from-sanity.mjs`). Sanity is no longer used and can be shut down after launch.

## Go-live checklist
1. Push `v3` to GitHub, and Vercel builds a Preview automatically.
2. Vercel → Settings:
   - Framework is Astro (`vercel.json` forces it).
   - Node 24.
   - Add the environment variables listed in README.md. Set `GITHUB_BRANCH=v3` for Preview and `main` for Production.
3. In Resend, verify `ringopizzeria.com` (DNS records) so the login emails come from panel@ringopizzeria.com.
4. Test the Preview:
   - /, /carta, /en, /en/menu
   - /panel: sign in, make one edit, undo it
5. Merge `v3` → `main`, then check the production site.
6. After launch:
   - Google Search Console: add the property and submit `sitemap-index.xml`.
   - Bing Webmaster Tools: import from Search Console. ChatGPT search relies on Bing.
   - Google Business Profile: website = https://www.ringopizzeria.com, menu link = https://www.ringopizzeria.com/carta, order links = Glovo / Uber Eats.
   - Vercel: turn on Web Analytics.

## Not built yet (needs access first)
- **Google Business Profile sync** for hours and closures. Needs Google's approval for Business Profile API access, plus Mattia adding TBH as a manager of his profile. Until then the panel labels Google as "Pendiente".
- **Automatic Instagram posting.** Needs @ringobar_ to be a Business account and a Meta app with publishing permission. For now the panel generates the branded story image and Mattia shares it with one tap.
- **Glovo / Uber Eats**: their APIs are partner-only, so the panel links Mattia straight to their merchant apps.
- **Automatic English translation** of new dishes. The English fields are optional; when they're empty, the EN pages show the Spanish text. This could be added with a DeepL key.

## Data decisions taken during the import
- Fixed: "Calzone York y Champiñones" had the English name "4 Cheeses Calzone"; Atún said "tomate, tomate".
- Water, coffee and beer now use real sizes or price ranges instead of €0.
- The 2 placeholder "Promociones" items (€0) were dropped.
- The 4 calzones share one photo in the old data. Ask Mattia for individual photos.
- The "Sin carne" tag was set automatically from the ingredients (no ham, salami, chicken, tuna, etc.). Mattia can change it in the panel.

## Where things are
- Data: `src/data/*.json`. Types and helpers: `src/lib/data.ts`. JSON-LD: `src/lib/seo.ts`. AI files: `src/lib/machine.ts`.
- Pages: `src/components/Home.astro`, `src/components/Carta.astro`, `src/layouts/Base.astro`.
- Panel: UI in `src/pages/panel/index.astro`; API in `src/pages/api/panel/[action].ts`, backed by `src/lib/server/{store,auth,mutations}.ts`.
- Design source (mockups, approval boards): TBH workspace `tbh-design/ringo-pizzeria-v3/`.
