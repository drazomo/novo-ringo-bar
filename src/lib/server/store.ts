// Storage for the owner panel.
// Production: reads and commits files in the GitHub repo (GITHUB_TOKEN + GITHUB_REPO + GITHUB_BRANCH);
// every save is one commit, and the host (Cloudflare Workers Builds or Vercel) redeploys the site from it.
// Local development (no GITHUB_TOKEN): reads and writes the working tree directly.
import { env, isProd, site } from "./env";
const localFs = async () => ({ fs: await import("node:fs/promises"), path: await import("node:path") });

export type FileWrite = { path: string; content: string | Buffer };

const token = () => env("GITHUB_TOKEN");
const repo = () => site.repo();
const branch = () => site.branch();
export const storageMode = () => (token() && repo() ? "github" : isProd() ? "missing" : "local");

async function gh(pathname: string, init: RequestInit = {}) {
  const r = await fetch(`https://api.github.com/repos/${repo()}${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "tbh-site-engine",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!r.ok) {
    const msg = await r.text();
    const err = new Error(`GitHub ${r.status} ${pathname}: ${msg.slice(0, 300)}`) as Error & { status?: number };
    err.status = r.status;
    throw err;
  }
  return r.json();
}

export async function readText(p: string): Promise<string> {
  const mode = storageMode();
  if (mode === "missing") throw new Error("Storage not configured: set GITHUB_TOKEN and GITHUB_REPO.");
  if (mode === "local") { const { fs, path } = await localFs(); return fs.readFile(path.join(process.cwd(), p), "utf8"); }
  const j = await gh(`/contents/${encodeURI(p)}?ref=${encodeURIComponent(branch())}`);
  if (j.content) return Buffer.from(j.content, "base64").toString("utf8");
  // > 1 MB files come back without inline content
  const blob = await gh(`/git/blobs/${j.sha}`);
  return Buffer.from(blob.content, "base64").toString("utf8");
}

export async function readJSON<T>(p: string): Promise<T> {
  return JSON.parse(await readText(p)) as T;
}

/** Write several files as ONE commit (GitHub) or plain writes (local). */
export async function commit(files: FileWrite[], message: string, author?: { name: string; email: string }) {
  const mode = storageMode();
  if (mode === "missing") throw new Error("Storage not configured: set GITHUB_TOKEN and GITHUB_REPO.");
  if (mode === "local") {
    const { fs, path } = await localFs();
    for (const f of files) {
      const abs = path.join(process.cwd(), f.path);
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.writeFile(abs, f.content);
    }
    return { sha: "local", url: null as string | null };
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const ref = await gh(`/git/ref/heads/${encodeURIComponent(branch())}`);
      const parent = ref.object.sha;
      const base = await gh(`/git/commits/${parent}`);
      const tree = [];
      for (const f of files) {
        const blob = await gh(`/git/blobs`, {
          method: "POST",
          body: JSON.stringify(typeof f.content === "string"
            ? { content: f.content, encoding: "utf-8" }
            : { content: f.content.toString("base64"), encoding: "base64" }),
        });
        tree.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha });
      }
      const t = await gh(`/git/trees`, { method: "POST", body: JSON.stringify({ base_tree: base.tree.sha, tree }) });
      const c = await gh(`/git/commits`, {
        method: "POST",
        body: JSON.stringify({ message, tree: t.sha, parents: [parent], ...(author ? { author: { ...author, date: new Date().toISOString() } } : {}) }),
      });
      await gh(`/git/refs/heads/${encodeURIComponent(branch())}`, { method: "PATCH", body: JSON.stringify({ sha: c.sha, force: false }) });
      return { sha: c.sha as string, url: c.html_url as string | null };
    } catch (e) {
      // 422 = the branch moved under us (another save landed); retry on the new head.
      if ((e as { status?: number }).status === 422 && attempt < 2) continue;
      throw e;
    }
  }
  throw new Error("commit failed");
}
