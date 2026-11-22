import type { APIRoute } from "astro";
// One wildcard group: search engines and AI assistants (discovery and user-triggered fetches) are all welcome.
export const GET: APIRoute = ({ site }) => new Response(
`User-agent: *
Allow: /
Disallow: /panel
Disallow: /api/

Sitemap: ${new URL("sitemap-index.xml", site)}
`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
