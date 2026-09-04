# Sprey WP Stack

> **Product landing:** [Sprey WP Stack](https://wp-stack.sprey.win/)  
> **Sprey Docs:** [docs.sprey.win](https://docs.sprey.win/)  
> **Stack documentation:** [Sprey WP Stack docs](https://docs.sprey.win/stacks/wp-stack/)

Small, production-oriented WordPress/WooCommerce stack for a modest VPS. It keeps the public surface minimal: Caddy is the only service that publishes ports; WordPress, MariaDB, and optional phpMyAdmin stay on private Docker networks.

Sprey WP Stack is an **online storefront integration path** for Sprey's broader **non-custodial crypto acquiring** model. Sprey Processing is intended for businesses accepting crypto payments both online and in person; WooCommerce is one merchant-facing integration, not the boundary of the payment product.

## Included

- Caddy: automatic HTTPS, HTTP/3, compression, reverse proxy
- WordPress + Apache: the public site
- WooCommerce: bundled in the Sprey WordPress image
- BTCPay for WooCommerce V2: bundled in the Sprey WordPress image
- MariaDB: persistent WordPress database
- phpMyAdmin: optional and not started by default; it listens only on localhost
- Cloudflare Worker request-time failover to a static outage page
- `status.sh`: disk, inode, RAM, swap, load, container resource, and Docker storage overview
- bounded Docker logs: local logging driver, 10 MB per file, up to 3 files per container

## Requirements

- For automatic installation: a fresh supported Ubuntu or Debian VPS; Docker Engine and Docker Compose v2 do not need to be preinstalled because the installer installs them when absent
- A domain with `A` (and, if used, `AAAA`) records pointing to the VPS
- Firewall allowing TCP `80`, TCP `443`, and UDP `443`; SSH should be restricted to your own IP or VPN

## Before installation

On a fresh VPS, update installed packages first:

```bash
sudo apt update
sudo apt upgrade -y
test -f /var/run/reboot-required && sudo reboot
```

If the VPS reboots, reconnect before continuing.

## One-command install (Ubuntu/Debian)

On a new VPS, point DNS first and then run:

```bash
git clone https://github.com/spreywin/sprey-wp-stack.git
cd sprey-wp-stack
sudo ./install.sh example.com admin@example.com
```

The installer installs Docker when needed, creates strong database passwords in `.env`, configures UFW without closing the active SSH port, opens only SSH, HTTP, HTTPS and HTTP/3, builds the WordPress image with the tested WooCommerce and BTCPay plugin versions, enables the resource status helper, and starts the stack. It uses the port of the active SSH connection when available; when `sudo` does not preserve `SSH_CONNECTION`, it falls back to `sshd`'s effective configuration. It refuses to replace an existing `.env` or run on an unsupported system.

## Manual start

```bash
git clone https://github.com/spreywin/sprey-wp-stack.git
cd sprey-wp-stack
cp .env.example .env
chmod 600 .env
# Edit DOMAIN, ACME_EMAIL and all password fields in .env.
docker compose config --quiet
docker compose pull --ignore-buildable
docker compose build wordpress
docker compose up -d
docker compose ps
```

Open `https://YOUR_DOMAIN` and complete the WordPress installer. Caddy obtains and renews certificates automatically once DNS and firewall settings are correct. WooCommerce and BTCPay for WooCommerce V2 are then available to activate without a separate download.

## Resource and disk status

Run the bundled status command whenever you need a quick VPS health snapshot:

```bash
./status.sh
```

It reports system uptime/load, root filesystem usage, inode usage, RAM/swap, Compose service state, a one-shot container CPU/memory/network/block-I/O snapshot, and Docker disk usage. For a deeper storage breakdown:

```bash
docker system df -v
```

## Log rotation

All stack containers use Docker's `local` logging driver with explicit rotation limits:

```text
max-size: 10m
max-file: 3
```

This prevents application and proxy logs from growing without a bound and silently consuming the VPS disk. The limit applies to Caddy, WordPress, MariaDB, and the optional phpMyAdmin container.

## BTCPay Server and WooCommerce

Sprey WP Stack does not run BTCPay Server inside the WordPress stack. Payment infrastructure remains separate. The official **BTCPay for WooCommerce V2** plugin and WooCommerce itself are bundled into the Sprey WordPress image.

The payment model is deliberately non-custodial:

```text
WooCommerce order -> BTCPay invoice -> merchant-controlled wallet / payment destination
                         |
                         +-> verified invoice/payment state -> WooCommerce order status
```

WooCommerce owns products, prices, stock, carts, checkout, and orders. BTCPay creates and observes invoice/payment state. The merchant owns the wallet or payment destination. Sprey does not receive, hold, or forward merchant funds.

Recommended deployment flow:

1. Deploy Sprey WP Stack and complete WordPress setup.
2. Activate WooCommerce and complete its initial store setup.
3. Activate BTCPay for WooCommerce V2.
4. Connect the plugin to a BTCPay Server store. For Sprey deployments, `https://pay.sprey.win` is the recommended hosted endpoint.
5. Configure the BTCPay store with the merchant-controlled wallet or supported external payment destination.
6. Run a test payment and verify both the WooCommerce order state and receipt at the merchant-controlled destination before accepting production orders.

Canonical connection and testing instructions: [BTCPay for WooCommerce](https://docs.sprey.win/integrations/btcpay-woocommerce/).

For evaluation only, BTCPay Server provides official mainnet and testnet demo instances. See the integration guide above for the current endpoints and limitations.

Do not store BTCPay Server secrets, API keys, wallet seeds, private spending keys, or payment credentials in this repository. For Sprey-hosted BTCPay, custody must remain with the merchant.

## Cloudflare and outage fallback

Cloudflare support is part of the v1.0 deployment scope.

For initial deployment, make sure Caddy can obtain a valid origin certificate. After HTTPS is working, enable the Cloudflare proxy and use **Full (strict)** SSL/TLS mode. Do not cache WooCommerce cart, checkout, account, or WordPress admin routes.

The v1.0 availability design places a **Cloudflare Worker** in front of `sprey.win`. The Worker forwards each request to the primary WordPress VPS. On a network failure, a bounded timeout, or a selected upstream status (`502`, `503`, or `504`), it serves the static `sprey-outage.pages.dev` page instead. Every new request tries the primary again, so normal service returns automatically as soon as the VPS responds successfully.

This is request-time failover on the Workers Free plan, not Cloudflare Load Balancing and not an independent periodic health monitor. An outage is detected only when a visitor request reaches the Worker. Review the current Workers Free limits before production use.

The Pages site is an outage notice only. It must never be presented as a functioning WooCommerce store: cart, checkout, account, order processing and payment flows require the live WordPress origin.

See [`cloudflare/README.md`](cloudflare/README.md) for the Worker source, a test-hostname rollout, production activation, validation, rollback, and operational checks.

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
./status.sh
docker compose logs -f caddy

# Update external images and rebuild the storefront. Review release notes first.
docker compose pull --ignore-buildable
docker compose build wordpress
docker compose up -d

# Database dump (create the backups directory first)
mkdir -p backups
docker compose exec -T mariadb mariadb-dump -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" \
  > "backups/wordpress-$(date +%F).sql"
```

Do not run `docker compose down -v` on a live stack: it removes the named volumes containing the site, database, and Caddy certificates.

## Documentation model

The repository keeps two public surfaces intentionally:

- the **Sprey WP Stack product landing** stays in this repository under `docs/` and is published at `https://wp-stack.sprey.win/`;
- canonical cross-project documentation lives in [`spreywin/sprey-docs`](https://github.com/spreywin/sprey-docs), covering platform architecture, products, stacks, integrations, and operations.

The product landing supports responsive layouts, Light/Dark/Auto themes, and optional machine-translated views while English remains the canonical source.

## Repository conventions

- All canonical public documentation, source comments, UI strings, examples, commit messages and release notes are written in English.
- Copy `.env.example` to `.env`; `.env` never enters Git.
- Default tags deliberately follow current stable WordPress/PHP and Caddy, plus the MariaDB LTS line.
- WooCommerce and BTCPay plugin versions are explicit build arguments in `.env` so upgrades are intentional and testable.
- Override an image tag or bundled plugin version only after testing a compatibility exception or upgrade.
- Use a fork or a template repository for each deployment; configuration and runtime data remain outside version control.
- Back up both the MariaDB database and WordPress uploads before upgrades.

## v1.0 scope

Sprey WP Stack v1.0 covers the WordPress/WooCommerce site stack, bundled WooCommerce and BTCPay for WooCommerce V2, bounded container logging, built-in VPS resource visibility, the product landing, and request-time Cloudflare Worker failover to the static outage page. Shared architecture and product documentation live in the independent Sprey Docs portal.

Monitoring platforms, VPN/control-plane services, and the BTCPay Server infrastructure itself remain separate projects/services.
