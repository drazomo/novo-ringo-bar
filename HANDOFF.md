# HANDOFF: Ringo Bar v3 (read this before changing anything)

Last updated: 22 Nov 2026, by Hermy (TBH) for Mark Rasavong.

## Status
- Branch **`v3`**: complete Astro rebuild of the site plus the owner panel.
  - 27/27 panel end-to-end checks pass locally (`e2e-panel.js` in the parent folder).
  - Lighthouse on mobile: Performance 95–97, Accessibility 100, SEO 100.
  - Live on Vercel Preview: https://novo-ringo-bar-git-v3-markrasavongs-projects.vercel.app (stable branch URL).
- `main`: still the 2023 Next.js + Sanity site that runs ringopizzeria.com today. Nothing goes live until v3 is merged.
- The Sanity data was imported once (`scripts/migrate-from-sanity.mjs`). Sanity is no longer used and can be shut down after launch.

## Go-live checklist
1. DONE: `v3` pushed; Vercel builds a Preview on every push.
2. DONE (22 Nov 2026): Vercel env vars set for Production + Preview:
   - `GITHUB_TOKEN`: fine-grained PAT "Panel Ringo (Vercel)", novo-ringo-bar only, Contents read/write, no expiry
   - `GITHUB_REPO`
   - `GITHUB_BRANCH`: `main` Production / `v3` Preview
   - `PANEL_SECRET`
   - `PANEL_EMAILS` = ringobaroe@gmail.com (Mattia), mark@thebrandinghouseusa.com
   - `PANEL_MAIL_FROM`
   - `RESEND_API_KEY`: sending-only, ringopizzeria.com only
3. DONE: Resend domain ringopizzeria.com (region eu-west-1) is in Mark's Resend team "thebrandinghouseusa". Its DNS records were added at Spaceship: `resend._domainkey` TXT, `rsend` + `send` CNAME, `_dmarc` TXT. A login email to Mark was Delivered.
4. DONE: Preview tested by Mark. A real sign-in worked, the edits committed to `v3`, and undo worked.
5. DONE (22 Nov 2026): Mark chose to stay on Vercel Hobby. `v3` was merged to `main` and is live on www.ringopizzeria.com. The old site is tagged `old-nextjs-site` for rollback.
6. After launch:
   - Google Search Console: add the property and submit `sitemap-index.xml`.
   - Bing Webmaster Tools: import from Search Console. ChatGPT search relies on Bing.
   - Google Business Profile: website = https://www.ringopizzeria.com, menu link = https://www.ringopizzeria.com/carta, order links = Glovo / Uber Eats.
   - Vercel: turn on Web Analytics.
   - Optional: delete the leftover branch-specific Preview (v3) copies of PANEL_SECRET / PANEL_MAIL_FROM in Vercel. They are harmless.

## Imprimir QR (panel → /panel/qr), live since 22 Nov 2026
- It has three A4 sheets: a poster (1), table cards (4) and stickers (12). Each has its own print button; only that sheet prints, as one A4 page.
- It also offers PNG and SVG downloads for print shops (`/panel/qr-carta.png`, `/panel/qr-carta.svg`).
- The QR codes are generated at build time by `qrcode` (`src/lib/qr.ts`), with error correction H so the logo can sit in the middle. All 17 codes were scan-tested with jsQR.
- **Never change `QR_TARGET`** (`https://www.ringopizzeria.com/carta`): printed codes can't be updated. If /carta ever moves, add a redirect instead.
- The page needs no login, because it only shows public info. It's `noindex`, and robots.txt disallows `/panel`.

## Undo rules (panel)
- After every save, the "Guardado" toast shows **Deshacer** for 8 seconds. Inicio lists the last 8 changes.
- Only the **newest change for each thing** can be undone. A "thing" is one dish, one closure, the hours, or the categories. The server enforces this (`changeKey` in `mutations.ts`), because undoing an older change would silently wipe out newer edits. An undo row offers **Rehacer**.
- Local dev: `astro dev` reloads the page when `src/data/*.json` changes, which hides the toast. Production never reloads like this because it writes to GitHub.

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
