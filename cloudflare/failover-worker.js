const PRIMARY_TIMEOUT_MS = 5000;
const FAILOVER_STATUSES = new Set([502, 503, 504, 521]);
const FALLBACK_URL = "https://sprey-outage.pages.dev/";

async function fetchPrimary(request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("Primary origin timeout"), PRIMARY_TIMEOUT_MS);

  try {
    return await fetch(new Request(request, { signal: controller.signal }));
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchFallback(request) {
  const fallback = await fetch(FALLBACK_URL, {
    method: request.method === "HEAD" ? "HEAD" : "GET",
    redirect: "follow",
  });
  const headers = new Headers(fallback.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("Retry-After", "60");
  headers.set("X-Sprey-Failover", "static-outage-page");

  return new Response(request.method === "HEAD" ? null : fallback.body, {
    status: 503,
    statusText: "Service Unavailable",
    headers,
  });
}

export default {
  async fetch(request) {
    try {
      const primary = await fetchPrimary(request);

      if (!FAILOVER_STATUSES.has(primary.status)) {
        return primary;
      }

      await primary.body?.cancel();
    } catch {
      // Network errors and the explicit primary timeout use the static fallback.
    }

    try {
      return await fetchFallback(request);
    } catch {
      return new Response("Sprey is temporarily unavailable. Please try again shortly.", {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "text/plain; charset=UTF-8",
          "Retry-After": "60",
          "X-Sprey-Failover": "fallback-unavailable",
        },
      });
    }
  },
};
