import type { APIRoute } from "astro";
export const GET: APIRoute = () => new Response(JSON.stringify({
  name: "Pizzería Ringo", short_name: "Pizzería Ringo", start_url: "/carta", display: "standalone",
  background_color: "#FBF7F0", theme_color: "#D3201B", lang: "es",
  icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
}), { headers: { "Content-Type": "application/manifest+json" } });
