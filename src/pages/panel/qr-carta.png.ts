import type { APIRoute } from "astro";
import { qrPng } from "../../lib/qr";

export const prerender = true;

export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await qrPng()), {
    headers: { "Content-Type": "image/png", "Content-Disposition": 'attachment; filename="ringo-bar-qr-carta.png"' },
  });
