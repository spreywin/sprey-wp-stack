# Sprey WP Stack

> **Documentation:** [Sprey Docs](https://docs.sprey.win/stacks/wp-stack/) · [Temporary GitHub Pages portal](https://spreywin.github.io/sprey-docs/stacks/wp-stack/)

Small, production-oriented WordPress/WooCommerce stack for a modest VPS. It keeps the public surface minimal: Caddy is the only service that publishes ports; WordPress, MariaDB, and optional phpMyAdmin stay on private Docker networks.

## Included

- Caddy: automatic HTTPS, HTTP/3, compression, reverse proxy
- WordPress + Apache: the public site
- MariaDB: persistent WordPress database
- phpMyAdmin: optional and not started by default; it listens only on localhost
- WooCommerce-ready WordPress deployment
- BTCPay for WooCommerce V2 integration guidance
- Cloudflare production guidance and static outage-page failover design

## Requirements

- A Linux VPS with Docker Engine and Docker Compose v2
- A domain with `A` (and, if used, `AAAA`) records pointing to the VPS
- Firewall allowing TCP `80`, TCP `443`, and UDP `443`; SSH should be restricted to your own IP or VPN

## One-command install (Ubuntu/Debian)

On a new VPS, point DNS first and then run:

```bash
git clone https://github.com/spreywin/sprey-wp-stack.git
cd sprey-wp-stack
sudo ./install.sh example.com admin@example.com
```

The installer installs Docker when needed, creates strong database passwords in `.env`, configures UFW without closing the active SSH port, opens only SSH, HTTP, HTTPS and HTTP/3, and starts the stack. It uses the port of the active SSH connection, falling back to `sshd`'s effective configuration only when run from a provider console. It refuses to replace an existing `.env` or run on an unsupported system.

## Manual start

```bash
git clone https://github.com/spreywin/sprey-wp-stack.git
cd sprey-wp-stack
cp .env.example .env
chmod 600 .env
# Edit DOMAIN, ACME_EMAIL and all password fields in .env.
docker compose config --quiet
docker compose up -d
docker compose ps
```

Open `https://YOUR_DOMAIN` and complete the WordPress installer. Caddy obtains and renews certificates automatically once DNS and firewall settings are correct.

## BTCPay Server and WooCommerce

Sprey WP Stack does not run BTCPay Server inside the WordPress stack. Payment infrastructure remains separate. WooCommerce connects to an existing BTCPay Server instance with the current **BTCPay for WooCommerce V2** integration.

Recommended deployment flow:

1. Deploy Sprey WP Stack and complete WordPress setup.
2. Install and activate WooCommerce.
3. Install the current BTCPay for WooCommerce V2 plugin.
4. Connect the plugin to the intended BTCPay Server store using the integration flow provided by BTCPay Server.
5. Run a test payment before accepting production orders.

Do not store BTCPay Server secrets, API keys, wallet seeds, or payment credentials in this repository.

## Cloudflare and outage fallback

Cloudflare support is part of the v1.0 deployment scope.

For initial deployment, make sure Caddy can obtain a valid origin certificate. After HTTPS is working, enable the Cloudflare proxy and use **Full (strict)** SSL/TLS mode. Do not cache WooCommerce cart, checkout, account, or WordPress admin routes.

The v1.0 availability design uses the WordPress VPS as the primary origin and a static **Cloudflare Pages outage site** as the passive fallback. A Cloudflare health monitor/load-balancing configuration can route visitors to the outage page when the WordPress origin is unhealthy and return traffic to WordPress after recovery.

The Pages site is an outage notice only. It must never be presented as a functioning WooCommerce store: cart, checkout, account, order processing and payment flows require the live WordPress origin.

## Optional phpMyAdmin

It is intentionally off by default. Prefer SSH and `docker compose exec mariadb mariadb -u root -p` for routine database work.

If you need phpMyAdmin temporarily, start it and tunnel the local-only port:

```bash
docker compose --profile admin up -d phpmyadmin
# Run this on your own computer, then open http://localhost:8081.
ssh -L 8081:127.0.0.1:8081 root@YOUR_SERVER
```

Remove it again when finished:

```bash
docker compose --profile admin stop phpmyadmin
```

## Operations

```bash
# Validate and inspect
docker compose config --quiet
docker compose ps
docker compose logs -f caddy

# Update images and recreate containers. Review release notes first.
docker compose pull
docker compose up -d

# Database dump (create the backups directory first)
mkdir -p backups
docker compose exec -T mariadb mariadb-dump -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" \
  > "backups/wordpress-$(date +%F).sql"
```

Do not run `docker compose down -v` on a live stack: it removes the named volumes containing the site, database, and Caddy certificates.

## Repository conventions

- All public documentation, source comments, UI strings, examples, commit messages and release notes are written in English.
- Canonical cross-project documentation lives in [`spreywin/sprey-docs`](https://github.com/spreywin/sprey-docs); this repository stays focused on the WP Stack implementation.
- Copy `.env.example` to `.env`; `.env` never enters Git.
- Default tags deliberately follow current stable WordPress/PHP and Caddy, plus the MariaDB LTS line.
- Override an image tag in `.env` only after testing a compatibility exception.
- Use a fork or a template repository for each deployment; configuration and runtime data remain outside version control.
- Back up both the MariaDB database and WordPress uploads before upgrades.

## v1.0 scope

Sprey WP Stack v1.0 covers the WordPress/WooCommerce site stack, BTCPay for WooCommerce integration guidance, and the Cloudflare outage-fallback deployment design. Shared architecture and product documentation live in the independent Sprey Docs portal.

Monitoring platforms, VPN/control-plane services, and the BTCPay Server infrastructure itself remain separate projects/services.
