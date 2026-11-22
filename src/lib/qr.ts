// QR codes are generated at build time (no runtime JS, no third-party QR service).
import QRCode from "qrcode";
import site from "../data/site.json";

/** Where the printed QR points. Keep it stable: printed codes can't be updated. */
export const QR_TARGET = `${site.url}/carta`;
export const QR_LABEL = QR_TARGET.replace(/^https?:\/\/(www\.)?/, "");

/**
 * Error correction "H" (30%) so the code still scans with the logo in the middle,
 * with a bit of grease on a table card, or slightly creased.
 */
export async function qrSvg(url = QR_TARGET, dark = "#1C1714") {
  return QRCode.toString(url, { type: "svg", errorCorrectionLevel: "H", margin: 0, color: { dark, light: "#0000" } });
}

/** Plain high-resolution PNG (no logo) for print shops. */
export async function qrPng(url = QR_TARGET, width = 2000) {
  return QRCode.toBuffer(url, { type: "png", errorCorrectionLevel: "H", margin: 4, width, color: { dark: "#000000", light: "#FFFFFF" } });
}
