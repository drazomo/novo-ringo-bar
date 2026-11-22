import type { APIRoute } from "astro";
import { menuMarkdown } from "../../lib/machine";
export const GET: APIRoute = () => new Response(menuMarkdown("en"), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
