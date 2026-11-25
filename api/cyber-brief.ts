// Cyber Brief endpoint: GET /api/cyber-brief?page=1&topic=all|cyber|ai&q=text
//
// Two data sources, merged by link:
//   1. an optional archive (a news.json at NEWS_ARCHIVE_URL): the searchable history. There is
//      no archive job in this repo; without the variable the page runs on live feeds alone.
//   2. the small live feeds, fetched here (the three big downloads are only read through an
//      archive: edge functions have a small CPU budget)
// Cached at Vercel's edge for 10 minutes, so upstream sees a handful of requests an hour no
// matter how many people open the page. No visitor data is read, stored or logged.

import { SOURCES, collectLive, highlights, isArchive, loadSource, mergeArchive, queryItems, type Item } from "./_lib/brief";

export const config = { runtime: "edge" };

// read per request: edge env only exists at runtime
const archiveUrl = (): string => process.env.NEWS_ARCHIVE_URL ?? "";

function json(body: unknown, status = 200, cache = "public, s-maxage=600, stale-while-revalidate=1800"): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": cache },
  });
}

async function loadArchive(): Promise<{ ok: boolean; items: Item[]; updated: number }> {
  const url = archiveUrl();
  if (!url) return { ok: false, items: [], updated: 0 };
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(String(res.status));
    const data: unknown = await res.json();
    if (!isArchive(data)) throw new Error("shape");
    return { ok: true, items: data.items, updated: data.updated };
  } catch {
    return { ok: false, items: [], updated: 0 };
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") return json({ error: "method not allowed" }, 405, "no-store");
  try {
    const url = new URL(req.url);
    const now = Date.now();
    const [archive, live] = await Promise.all([loadArchive(), collectLive(now, loadSource, true)]);
    const merged = mergeArchive(archive.items, live.items, now);
    const result = queryItems(merged, {
      topic: url.searchParams.get("topic") ?? "all",
      q: (url.searchParams.get("q") ?? "").slice(0, 80),
      page: Number(url.searchParams.get("page")),
    });
    const q = (url.searchParams.get("q") ?? "").trim();
    return json({
      generated: now,
      ...result,
      // only on the plain first page: a search or page 7 is not the place to be interrupted
      highlights: result.page === 1 && !q ? highlights(merged, now) : [],
      archive: { ok: archive.ok, count: archive.items.length, updated: archive.updated },
      // heavy sources are fetched by the Action only; show them as healthy when the archive is
      sources: [
        ...SOURCES.filter((s) => s.heavy && archiveUrl()).map((s) => ({ id: s.id, name: s.name, ok: archive.ok, count: 0, note: "updated by the archive job" })),
        ...live.sources,
      ],
    });
  } catch {
    return json({ error: "brief unavailable" }, 503, "no-store");
  }
}
