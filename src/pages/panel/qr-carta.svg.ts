import type { APIRoute } from "astro";
import QRCode from "qrcode";
import { QR_TARGET } from "../../lib/qr";

export const prerender = true;

// Vector version for print shops (scales to any size). Black on white, with a quiet zone.
export const GET: APIRoute = async () =>
  new Response(
    await QRCode.toString(QR_TARGET, { type: "svg", errorCorrectionLevel: "H", margin: 4, color: { dark: "#000000", light: "#FFFFFF" } }),
    { headers: { "Content-Type": "image/svg+xml", "Content-Disposition": 'attachment; filename="ringo-bar-qr-carta.svg"' } },
  );
