// Runtime environment helpers shared by the panel API.
// Works on Cloudflare Workers (nodejs_compat populates process.env from vars/secrets),
// on Vercel, and in local dev (astro dev).
export const env = (k: string): string | undefined =>
  (typeof process !== "undefined" ? process.env?.[k] : undefined) ||
  (import.meta.env as Record<string, string | undefined>)[k];

/** True when deployed (Cloudflare or Vercel). Local dev falls back to file storage + console login links. */
export const isProd = () =>
  env("PANEL_ENV") === "production" || !!env("VERCEL") || !!env("CF_PAGES");

/** Per-site settings (set as env vars/secrets per client deploy). */
export const site = {
  panelName: () => env("PANEL_NAME") || "Panel",
  repo: () => env("GITHUB_REPO") || "",
  branch: () => env("GITHUB_BRANCH") || "main",
  timeZone: () => env("SITE_TZ") || "Europe/Madrid",
};
