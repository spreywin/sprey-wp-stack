# Cloudflare Worker failover

This directory contains the v1 request-time failover implementation for `sprey.win`.

```text
visitor -> Cloudflare Worker -> primary WordPress VPS
                            \-> sprey-outage.pages.dev on failure
```

The Worker attempts the primary origin for every request. It serves the static fallback after a network error, a five-second timeout, or an upstream `502`, `503`, `504`, or `521`. The next visitor request tries the primary again, which provides automatic recovery without a DNS change.

This is not an independent health monitor. It does not probe the VPS periodically, keep shared health state, or fail over before a visitor arrives. It also does not make the outage page a WooCommerce replacement: cart, checkout, accounts, orders, sessions, and payments remain unavailable while WordPress is down.

## Prerequisites

- The `sprey.win` zone is active in Cloudflare.
- The WordPress DNS record is proxied through Cloudflare.
- Caddy already serves valid HTTPS and Cloudflare SSL/TLS mode is **Full (strict)**.
- `sprey-outage.pages.dev` serves the tested static outage page.
- Dynamic WooCommerce and WordPress administration routes bypass edge caching.
- Current Workers Free limits are sufficient for expected traffic.

Use a **Workers Route**, because the Worker runs in front of an external application server. Do not replace the WordPress DNS record with a Worker Custom Domain.

## 1. Create the Worker

1. In the Cloudflare dashboard, open **Workers & Pages** and create a Worker named `sprey-store-failover`.
2. Replace the starter code with [`failover-worker.js`](failover-worker.js).
3. Deploy the Worker, but do not add the production `sprey.win/*` route yet.
4. Keep the failure statuses and timeout conservative. Do not fail over on every `500`: an application-level error may contain information needed by an administrator or customer.

The Worker preserves the incoming method, body, path, query, cookies, and headers when it calls the primary. It never retries a request against WordPress, which avoids duplicating non-idempotent actions. The fallback is always fetched as `GET` or `HEAD` and returned with HTTP `503`, `Cache-Control: no-store`, and `Retry-After: 60`.

## 2. Test on an isolated hostname

Use a temporary hostname such as `failover-test.sprey.win` before touching production when the production storefront must remain uninterrupted:

1. Add a proxied DNS record for the test hostname that resolves to the same WordPress VPS as `sprey.win`.
2. Confirm Caddy accepts the test hostname and presents a valid certificate. Remove this hostname from Caddy after testing if it is not intended to remain available.
3. In the Worker's **Settings > Domains & Routes**, add the route `failover-test.sprey.win/*` in the `sprey.win` zone.
4. Browse representative public pages through the test hostname. Verify redirects, assets, cookies, login, cart, and checkout behavior without placing a real order.
5. Confirm a healthy response does not contain `X-Sprey-Failover`.
6. In a controlled maintenance window, make only the test hostname's origin path return `503`, or briefly block that test path at the origin. Verify the response is the static outage page, has status `503`, and includes `X-Sprey-Failover: static-outage-page`.
7. Restore the test origin and verify the next request immediately returns WordPress again.

Do not change the production DNS record during this test.

## 3. Enable production

1. Reconfirm the Worker code and fallback page in the Cloudflare dashboard.
2. Add the production Workers Route `sprey.win/*` to `sprey-store-failover`.
3. Leave the existing proxied DNS record pointing to the WordPress VPS. The route runs before that origin and `fetch(request)` continues to it.
4. Use **Fail open (proceed)** for the route failure mode so a Worker execution failure does not block a healthy origin.
5. Test the home page, a product page, cart, checkout, account, WordPress administration, and static assets.
6. Check the Worker's logs and analytics for exceptions, timeouts, unexpected `502/503/504/521` responses, and Free-plan usage.

## Validation

From a client that can reach the public hostname:

```bash
curl -sS -D - -o /dev/null https://failover-test.sprey.win/
curl -sS -D - -o /dev/null https://sprey.win/
```

Normal WordPress responses must not include `X-Sprey-Failover`. A controlled failure should return `503` plus one of:

```text
X-Sprey-Failover: static-outage-page
X-Sprey-Failover: fallback-unavailable
```

Also verify that Cloudflare cache rules bypass `/cart*`, `/checkout*`, `/my-account*`, `/wp-admin*`, `/wp-login.php*`, WooCommerce API endpoints, authenticated sessions, and requests carrying WooCommerce cart/session cookies.

## Verified production failover

The production `sprey.win/*` Workers Route has been verified with several controlled origin interruptions.

The verified sequence was:

1. Healthy origin returned HTTP `200` through Caddy with no `X-Sprey-Failover` header.
2. Stopping Caddy caused Cloudflare to return `521`, confirming that origin-unavailable failures must be included in the failover status set.
3. With `521` handled by the Worker, `sprey.win` returned the static `sprey-outage.pages.dev` page as HTTP `503` with `Cache-Control: no-store`, `Retry-After: 60`, and `X-Sprey-Failover: static-outage-page`.
4. Starting Caddy restored the next request to the normal WordPress origin with HTTP `200` and no `X-Sprey-Failover` header.
5. The same failover-and-recovery behavior was verified during a normal VPS reboot and during a VPS hard reboot.

These tests verify both service-level and full-origin failover, plus automatic recovery without a DNS change.

## Rollback

Remove or disable only the `sprey.win/*` Workers Route. With the existing proxied DNS record unchanged, requests return directly to the WordPress origin through Cloudflare. Removing the route does not remove the Worker or the static fallback and does not require a DNS change.

## Operational notes

- Treat a rise in fallback responses as an incident signal, not as proof that the whole VPS is down.
- Inspect the WordPress, Caddy, database, network, and Worker logs before changing failure criteria.
- Keep the static outage page independent from WordPress and free of store-like controls.
- Test failover after material Worker, Cloudflare, Caddy, DNS, VPS, or fallback-page changes.
- Review Cloudflare's current Workers limits and pricing before traffic approaches the Free-plan allowance.

Cloudflare references: <a href="https://developers.cloudflare.com/workers/configuration/routing/routes/" target="_blank" rel="noopener noreferrer">Workers Routes</a>, <a href="https://developers.cloudflare.com/workers/platform/limits/" target="_blank" rel="noopener noreferrer">Workers limits</a>, and <a href="https://developers.cloudflare.com/cache/how-to/cache-rules/" target="_blank" rel="noopener noreferrer">Cache Rules</a>.
