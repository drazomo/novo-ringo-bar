# Pizzería Ringo Bar: ringopizzeria.com (v3)

Website and owner panel for Pizzería Ringo Bar, an Italian pizzeria in Campanar, València.
Built by The Branding House (TBH) in November 2026. It replaces the 2023 Next.js + Sanity site (that code is still on `main` until v3 is merged).

## What's in it
| URL | What it is |
|---|---|
| `/` · `/en` | Home page (ES / EN) |
| `/carta` · `/en/menu` | Full menu with prices. **The QR codes on the tables point here.** |
| `/panel` | **Panel Ringo**, the owner's phone app for menu, prices, categories, hours and closures |
| `/carta.md` · `/en/menu.md` · `/llms.txt` | Plain-text menu and facts for AI assistants (ChatGPT, Perplexity, Gemini…) |
| `/sitemap-index.xml` · `/robots.txt` | Generated automatically |

## How it works
- **Astro 7, static output.** Every public page is plain, pre-built HTML (with almost no JavaScript), so it's fast and fully readable by Google and AI crawlers.
- **The content lives in this repo** as JSON in `src/data/`:
  - `menu.json`: categories and items (name, price or sizes, ingredients, EN text, tags, sold-out-today, hidden, photo)
  - `hours.json`: weekly hours, Monday = index 0, with one or more shifts per day
  - `closures.json`: holidays and closures. They drive the site banner, the "Cerrado" status and Google's `specialOpeningHours`
  - `site.json`: address, phone, links
  - `changes.json`: the panel's change log, with the previous values that power "Deshacer" (undo)
- Dish photos are in `src/assets/menu/`. Astro resizes them and converts them to WebP at build time.
- **Panel Ringo** (`src/pages/panel/` + `src/pages/api/panel/[action].ts`):
  - Mattia logs in with a one-tap email link (no password). Only the emails in `PANEL_EMAILS` can get one.
  - Every save is **one Git commit** to this repo (GitHub API). Vercel then rebuilds, and the change is live in about 1–2 minutes.
  - Undo restores the previous value of exactly what changed. Git history keeps everything else.
- Structured data (JSON-LD) is generated from the same data as the pages (`src/lib/seo.ts`): Restaurant, Menu + MenuItems + prices, BreadcrumbList, FAQPage. It can't drift from what's on screen.

## Vercel environment variables
| Name | Value |
|---|---|
| `GITHUB_TOKEN` | Fine-grained token, **only this repo**, permission *Contents: Read and write* |
| `GITHUB_REPO` | `drazomo/novo-ringo-bar` |
| `GITHUB_BRANCH` | `main` in Production (use `v3` for the Preview environment while testing) |
| `PANEL_SECRET` | 32+ random characters (`openssl rand -base64 48`) |
| `PANEL_EMAILS` | Comma-separated emails allowed into the panel (Mattia + TBH) |
| `RESEND_API_KEY` | Resend.com API key, used to email the login link |
| `PANEL_MAIL_FROM` | e.g. `Panel Ringo <panel@ringopizzeria.com>` (domain verified in Resend) |

In Vercel → Project → Analytics, turn on **Web Analytics** (the site already loads its script).

## Local development
```bash
npm install
cp .env.example .env      # set PANEL_EMAILS=you@example.com
npm run dev               # http://localhost:4321, panel at /panel
```
Without `GITHUB_TOKEN`, the panel writes straight to `src/data/` on your machine, and the login link is printed in the terminal instead of emailed.

`npm run check:data` validates the JSON files. Run it before committing hand edits.

## Editing by hand
You can still edit `src/data/*.json` directly and push. Keep the same shapes (see `src/lib/data.ts`). Prices are numbers (`10.5`), not strings.
