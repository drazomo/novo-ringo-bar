// Passwordless login for the owner panel: an emailed one-tap link, signed with PANEL_SECRET.
// Stateless: tokens are HMAC-signed, so no database is needed.
import crypto from "node:crypto";
import type { AstroCookies } from "astro";

import { env, isProd, site } from "./env";
export const COOKIE = "tbh_panel";
const LINK_TTL = 20 * 60 * 1000;            // login link valid 20 minutes
const SESSION_TTL = 90 * 24 * 3600 * 1000;  // stay signed in 90 days

function secret() {
  const s = env("PANEL_SECRET");
  if (s && s.length >= 32) return s;
  if (!isProd()) return "dev-only-secret-dev-only-secret-dev-only";
  throw new Error("PANEL_SECRET (32+ characters) is not set.");
}
const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");
const sign = (payload: string) => crypto.createHmac("sha256", secret()).update(payload).digest("base64url");

export function allowedEmails(): string[] {
  return (env("PANEL_EMAILS") || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}
export const isAllowed = (email: string) => allowedEmails().includes(email.trim().toLowerCase());

export function makeToken(email: string, kind: "link" | "session") {
  const body = b64(JSON.stringify({ e: email.toLowerCase(), k: kind, x: Date.now() + (kind === "link" ? LINK_TTL : SESSION_TTL), n: crypto.randomBytes(6).toString("hex") }));
  return `${body}.${sign(body)}`;
}

export function readToken(tok: string | undefined, kind: "link" | "session"): string | null {
  if (!tok || !tok.includes(".")) return null;
  const [body, sig] = tok.split(".");
  const good = sign(body);
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    if (p.k !== kind || p.x < Date.now() || !isAllowed(p.e)) return null;
    return p.e as string;
  } catch { return null; }
}

export function setSession(cookies: AstroCookies, email: string) {
  cookies.set(COOKIE, makeToken(email, "session"), {
    path: "/", httpOnly: true, sameSite: "lax", secure: isProd(), maxAge: SESSION_TTL / 1000,
  });
}
export const currentUser = (cookies: AstroCookies) => readToken(cookies.get(COOKIE)?.value, "session");

/** Reject cross-site POSTs (CSRF): the Origin header must match the request host. */
export function sameOrigin(req: Request) {
  const o = req.headers.get("origin");
  if (!o) return false;
  try { return new URL(o).host === new URL(req.url).host; } catch { return false; }
}

export async function sendLoginEmail(email: string, link: string) {
  const key = env("RESEND_API_KEY");
  if (!key) {
    if (isProd()) throw new Error("RESEND_API_KEY is not set.");
    console.log(`\n[panel] Login link for ${email} (dev, not emailed):\n${link}\n`);
    return;
  }
  const name = site.panelName();
  const from = env("PANEL_MAIL_FROM");
  if (!from) throw new Error("PANEL_MAIL_FROM is not set.");
  const html = `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px;color:#1C1714">
    <h1 style="font-family:Georgia,serif;font-size:26px;margin:0 0 12px">${name}</h1>
    <p style="font-size:16px;line-height:1.5">Pulsa el botón para entrar. El enlace caduca en 20 minutos.</p>
    <p style="margin:28px 0"><a href="${link}" style="background:#D3201B;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px;display:inline-block">Entrar al panel</a></p>
    <p style="font-size:13px;color:#8A7E74">Si no has pedido este enlace, ignora este email.</p></div>`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [email], subject: `Tu enlace para entrar en ${name}`, html, text: `Entra en ${name}: ${link}` }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 200)}`);
}
