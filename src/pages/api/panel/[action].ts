// Owner panel API. Runs on demand (Cloudflare Worker or Vercel function); every other page is static.
import type { APIRoute } from "astro";
import crypto from "node:crypto";
import { readJSON, commit, storageMode } from "../../../lib/server/store";
import { isAllowed, makeToken, readToken, setSession, currentUser, sameOrigin, sendLoginEmail, COOKIE } from "../../../lib/server/auth";
import * as M from "../../../lib/server/mutations";
import { site } from "../../../lib/server/env";

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

async function loadState(): Promise<M.State> {
  const [menu, hours, closures, changes] = await Promise.all([
    readJSON<M.Menu>(M.FILES.menu), readJSON<M.Hours>(M.FILES.hours),
    readJSON<M.State["closures"]>(M.FILES.closures), readJSON<M.Change[]>(M.FILES.changes),
  ]);
  return { menu, hours, closures, changes };
}

async function persist(s: M.State, files: readonly ("menu" | "hours" | "closures")[], who: string, summary: string, extra: { path: string; content: Buffer }[] = []) {
  const out = [
    ...files.map((f) => ({ path: M.FILES[f], content: JSON.stringify(f === "menu" ? s.menu : f === "hours" ? s.hours : s.closures, null, 2) + "\n" })),
    { path: M.FILES.changes, content: JSON.stringify(s.changes, null, 2) + "\n" },
    ...extra,
  ];
  return commit(out, `${site.panelName()}: ${summary}`, { name: `${site.panelName()} (${who})`, email: who });
}

const publicState = (s: M.State) => ({
  menu: s.menu, hours: s.hours, closures: s.closures,
  changes: s.changes.slice(0, 15).map(({ id, at, who, summary }) => ({ id, at, who, summary })),
});

export const GET: APIRoute = async ({ params, url, cookies, redirect }) => {
  if (params.action === "auth") {
    const email = readToken(url.searchParams.get("t") ?? undefined, "link");
    if (!email) return redirect("/panel#caducado", 302);
    setSession(cookies, email);
    return redirect("/panel#inicio", 302);
  }
  if (params.action === "data") {
    const who = currentUser(cookies);
    if (!who) return json({ error: "auth" }, 401);
    try { return json({ user: who, storage: storageMode(), ...publicState(await loadState()) }); }
    catch (e) { console.error(e); return json({ error: "No se pudo leer la carta. Inténtalo de nuevo en un minuto." }, 502); }
  }
  return json({ error: "not found" }, 404);
};

export const POST: APIRoute = async ({ params, request, cookies, url }) => {
  if (!sameOrigin(request)) return json({ error: "origin" }, 403);
  const action = params.action;
  let body: Record<string, unknown> = {};
  try { body = await request.json(); } catch { /* empty body */ }

  if (action === "login") {
    const email = String(body.email || "").trim().toLowerCase();
    // Same answer whether or not the email is allowed (no account discovery).
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && isAllowed(email)) {
      try { await sendLoginEmail(email, `${url.origin}/api/panel/auth?t=${makeToken(email, "link")}`); }
      catch (e) { console.error(e); return json({ error: "No se pudo enviar el email. Avisa a The Branding House." }, 502); }
    }
    return json({ ok: true });
  }
  if (action === "logout") { cookies.delete(COOKIE, { path: "/" }); return json({ ok: true }); }

  const who = currentUser(cookies);
  if (!who) return json({ error: "auth" }, 401);
  try {
    const s = await loadState();
    let r: { change: M.Change; files: readonly ("menu" | "hours" | "closures")[] };
    const extra: { path: string; content: Buffer }[] = [];
    switch (action) {
      case "item": r = M.saveItem(s, who, body); break;
      case "delete": r = M.deleteItem(s, who, String(body.id)); break;
      case "categories": r = M.saveCategories(s, who, body.categories); break;
      case "hours": r = M.saveHours(s, who, body.week); break;
      case "closure": r = M.saveClosure(s, who, body); break;
      case "closure-delete": r = M.deleteClosure(s, who, String(body.id)); break;
      case "undo": r = M.undo(s, who, String(body.id)); break;
      case "photo": {
        const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(body.dataUrl || ""));
        if (!m) throw new M.Invalid("Foto no válida");
        const buf = Buffer.from(m[2], "base64");
        if (buf.length > 3_000_000) throw new M.Invalid("La foto es demasiado grande");
        const item = s.menu.items.find((i) => i.id === body.id);
        if (!item) throw new M.Invalid("Ese plato ya no existe.");
        const file = `${item.id}-${crypto.randomBytes(3).toString("hex")}.${m[1] === "jpeg" ? "jpg" : m[1]}`;
        extra.push({ path: `src/assets/menu/${file}`, content: buf });
        r = M.saveItem(s, who, { ...item, photo: file, soldOut: undefined });
        r.change.summary = `${item.name}: foto nueva`;
        break;
      }
      default: return json({ error: "not found" }, 404);
    }
    const c = await persist(s, r.files, who, r.change.summary, extra);
    return json({ ok: true, commit: c.sha, ...publicState(s) });
  } catch (e) {
    if (e instanceof M.Invalid) return json({ error: e.message }, 400);
    console.error(e);
    return json({ error: "No se pudo guardar. Inténtalo otra vez en un momento." }, 502);
  }
};
