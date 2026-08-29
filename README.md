# Sprey WP Stack

> The public documentation website is deployed from `docs/` with GitHub Pages.

Small, production-oriented WordPress/WooCommerce stack for a modest VPS. It keeps the public surface minimal: Caddy is the only service that publishes ports; WordPress, MariaDB, and optional phpMyAdmin stay on private Docker networks.

## Included

- Caddy: automatic HTTPS, HTTP/3, compression, reverse proxy
- WordPress + Apache: the public site
- MariaDB: persistent WordPress database
- phpMyAdmin: optional and not started by default; it listens only on localhost

## Requirements

- A Linux VPS with Docker Engine and Docker Compose v2
- A domain with `A` (and, if used, `AAAA`) records pointing to the VPS
- Firewall allowing TCP `80`, TCP `443`, and UDP `443`; SSH should be restricted to your own IP or VPN

## One-command install (Ubuntu/Debian)

On a new VPS, point DNS first and then run:

```bash
git clone https://github.com/your-org/sprey-stack-lite.git
cd sprey-stack-lite
sudo ./install.sh example.com admin@example.com
```

The installer installs Docker when needed, creates strong database passwords in
`.env`, configures UFW without closing the active SSH port, opens only SSH,
HTTP, HTTPS and HTTP/3, and starts the stack. It uses the port of the active
SSH connection, falling back to `sshd`'s effective configuration only when run
from a provider console. It refuses to replace an existing `.env` or run on an
unsupported system.

## Manual start

```bash
git clone https://github.com/your-org/sprey-stack-lite.git
cd sprey-stack-lite
cp .env.example .env
chmod 600 .env
# Edit DOMAIN, ACME_EMAIL and all password fields in .env.
docker compose config --quiet
docker compose up -d
docker compose ps
```

Open `https://YOUR_DOMAIN` and complete the WordPress installer. Caddy obtains and renews certificates automatically once DNS and firewall settings are correct.

## Cloudflare

Cloudflare is compatible with this stack, but it is outside v1.0. For the first
certificate issuance, set the DNS record to **DNS only** so Caddy can complete
the HTTP challenge; enable the Cloudflare proxy after HTTPS works. Use **Full
(strict)** SSL/TLS mode. Do not cache WooCommerce cart, checkout, account, or
WordPress admin routes. Cloudflare Pages may later serve a static outage page,
but must never be treated as a live WooCommerce fallback.

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

# Update images and recreate containers. Review the release notes first,
# especially before a new MariaDB LTS line is selected.
docker compose pull
docker compose up -d

# Database dump (create the backups directory first)
mkdir -p backups
docker compose exec -T mariadb mariadb-dump -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" \
  > "backups/wordpress-$(date +%F).sql"
```

Do not run `docker compose down -v` on a live stack: it removes the named volumes containing the site, database, and Caddy certificates.

## Repository conventions

- Copy `.env.example` to `.env`; `.env` never enters Git.
- Default tags deliberately follow current stable WordPress/PHP and Caddy, plus
  the MariaDB LTS line. This keeps fresh deployments current without silently
  opting an existing database into an unsupported major-version migration.
- Override an image tag in `.env` only after testing a compatibility exception.
- Use a fork or a template repository for each deployment; configuration and runtime data remain outside version control.
- Back up both the MariaDB database and WordPress uploads before upgrades.

## Scope

This is the site stack only. Monitoring, VPN/control-plane services, payment
infrastructure, and Cloudflare outage handling belong to separate projects and
servers.
