# Sprey WP Stack

> **Stable release:** [v1.0.0](https://github.com/spreywin/sprey-wp-stack/releases/tag/v1.0.0) — released 2026-09-09  
> **Product landing:** [Sprey WP Stack](https://wp-stack.sprey.win/)  
> **Sprey Docs:** [docs.sprey.win](https://docs.sprey.win/)  
> **Stack documentation:** [Sprey WP Stack docs](https://docs.sprey.win/stacks/wp-stack/)

Production-ready **WordPress + WooCommerce Docker stack** for small VPS deployments, with **Caddy**, **MariaDB**, optional **phpMyAdmin**, and **BTCPay Server integration**. Caddy is the only public service. WordPress reaches the Internet through the `edge` network and reaches MariaDB through the private `app` network; MariaDB remains on `app` only. Optional phpMyAdmin is off by default and bound to localhost when started.

Sprey WP Stack is an online-store integration path for Sprey's broader non-custodial crypto acquiring model. Sprey Processing is the payment product; WP Stack is one prepared merchant storefront path into it.

## Included

- Caddy: automatic HTTPS, HTTP/3, compression, reverse proxy
- WordPress + Apache + PHP 8.4
- current stable WooCommerce bundled at image build time
- current stable BTCPay for WooCommerce V2 bundled at image build time
- MariaDB LTS
- optional phpMyAdmin, off by default and localhost-only
- Cloudflare Worker request-time failover to a static outage page
- `status.sh`: host profile, filesystem/inodes, RAM/swap, container resources, Docker usage, containerd/Docker storage directories, and a low-disk warning
- bounded Docker logs: local logging driver, 10 MB per file, up to 3 files per container

## Requirements

- fresh supported Ubuntu or Debian VPS for automatic installation
- domain pointed to the VPS before Caddy is expected to obtain HTTPS
- TCP `80`, TCP `443`, UDP `443`, and the active SSH port available through the firewall

A 10 GB root disk is sufficient for testing but leaves limited production headroom after a current Ubuntu system, Docker/containerd, WordPress, MariaDB, and images are installed. Use a larger disk for production when possible.

## Before installation

Update the operating system first:

```bash
sudo apt update
sudo apt upgrade -y
test -f /var/run/reboot-required && sudo reboot
```

Reconnect after a reboot before continuing.

## One-command install

```bash
git clone https://github.com/spreywin/sprey-wp-stack.git
cd sprey-wp-stack
sudo ./install.sh example.com admin@example.com
```

Replace both example values with the real deployment domain and email.

The installer currently:

- installs prerequisites and Docker Engine / Docker Compose v2 when needed;
- detects active swap and leaves existing swap unchanged;
- creates and enables a persistent 1 GiB swap file when no active swap exists;
- configures UFW while preserving the active SSH port;
- opens only SSH, HTTP, HTTPS, and HTTP/3;
- creates `.env` with strong generated database passwords;
- builds the WordPress image with the current stable WooCommerce and BTCPay for WooCommerce V2 packages;
- starts the stack;
- removes unused Docker builder cache after a successful build/start;
- cleans the APT package cache and lists after installation;
- enables the bundled `status.sh` resource helper.

The installer refuses to overwrite an existing `.env` deployment.

## Verified clean-host deployment

A clean installation has been verified on Ubuntu 26.04.1 LTS on a 1 vCPU / ~1 GB RAM VPS.

Verified results from the current clean test:

- the host started with no swap;
- the installer created 1 GiB swap and activated it successfully;
- the swap file persisted across a normal VPS reboot and returned active from `/etc/fstab`;
- Caddy, WordPress, and MariaDB started normally;
- MariaDB reported healthy;
- all three stack services returned automatically after the reboot;
- WordPress had working outbound DNS/HTTPS through `edge` while MariaDB remained isolated on `app`;
- WordPress Site Health reported **Good** after setup, with only the intentionally disabled search-engine indexing recommendation while the store remained private;
- current WooCommerce and BTCPay for WooCommerce V2 packages were bundled into the fresh build;
- the installer's automatic post-build cleanup completed in the fresh run and left Docker builder cache at `0 B`.

On the verified 10 GB test VPS, the completed fresh install used about 71% of the root filesystem and left about 2.8 GB free. This confirms that the stack fits for testing but has limited storage headroom for production growth.

## Manual start — verified on ARM64

The manual Compose path has been verified end to end on a separate clean Ubuntu 26.04.1 LTS ARM64 host.

Verified test host:

- architecture `aarch64`
- kernel `7.0.0-1010-oracle`
- 2 OCPU
- approximately 12 GB RAM
- 99 GB boot volume
- Docker `29.1.3`
- Docker Compose `2.40.3`
- no swap configured during the manual test

The manual path assumes the host prerequisites already exist. Before running the Compose sequence, update the OS, install Docker Engine and Docker Compose v2, configure the host/cloud firewall for the active SSH port plus TCP 80, TCP 443, and UDP 443, and point the deployment hostname to the server.

Then run:

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

Open `https://YOUR_DOMAIN` and complete the standard WordPress setup.

The verified ARM64 manual test confirmed:

- Compose validation returned exit code `0`;
- Caddy, MariaDB, and the custom WordPress image pulled/built as `linux/arm64`;
- the WordPress image built successfully on ARM64;
- MariaDB became healthy;
- HTTP redirected to HTTPS and Caddy obtained a valid Let's Encrypt certificate;
- HTTP/1.1, HTTP/2, and the HTTP/3 listener were enabled;
- WordPress completed normal installation and final Site Health had no critical issues;
- WooCommerce `11.1.0` and BTCPay For WooCommerce V2 `2.8.2` were present and activated successfully;
- expected WooCommerce tables were created;
- phpMyAdmin `latest` pulled as `linux/arm64`, started localhost-only on `127.0.0.1:8081`, and returned local HTTP `200`;
- after a normal host reboot, Caddy, WordPress, MariaDB, and an active phpMyAdmin returned automatically; MariaDB was healthy, the public site returned HTTP `200`, phpMyAdmin remained localhost-only and returned local HTTP `200`, and WordPress/database state persisted.

Canonical verification record: [WP Stack verification — 2026-09-07](https://docs.sprey.win/operations/wp-stack-verification-2026-09-07/).

## Resource and disk status

Run:

```bash
./status.sh
```

It reports:

- hostname, OS, kernel, architecture, virtualization, vCPU, CPU model, RAM, swap, root device, and root size;
- uptime and load;
- root filesystem and inode usage;
- RAM and swap use;
- `/var/lib/containerd` and `/var/lib/docker` sizes when present;
- Compose service state;
- one-shot container CPU/memory/network/block-I/O;
- Docker disk usage.

If the root filesystem reaches 80% used, `status.sh` prints a warning to investigate storage before upgrades or rebuilds.

For deeper Docker usage:

```bash
docker system df -v
```

On the current clean test host, most non-system application storage was under containerd image/content data plus persistent Docker volumes. Do not manually delete `/var/lib/containerd` or `/var/lib/docker` contents.

## Log rotation

All stack containers use Docker's `local` logging driver with explicit rotation limits:

```text
max-size: 10m
max-file: 3
```

## BTCPay Server and WooCommerce

Sprey WP Stack does not run BTCPay Server inside the WordPress VPS. Payment infrastructure remains separate.

```text
WooCommerce order -> BTCPay invoice -> merchant-controlled wallet / payment destination
                         |
                         +-> verified invoice/payment state -> WooCommerce order status
```

WooCommerce owns products, cart, checkout, and orders. BTCPay creates and observes invoice/payment state. The merchant owns the wallet or payment destination. Sprey does not receive, hold, or forward merchant funds.

Recommended deployment flow:

1. Deploy WP Stack and complete WordPress setup.
2. Activate/configure WooCommerce.
3. Activate BTCPay for WooCommerce V2.
4. Connect it to the merchant's BTCPay store; for Sprey-hosted deployments use `https://pay.sprey.win`.
5. Configure the merchant-controlled payment destination.
6. Run a real test payment and verify both WooCommerce order state and receipt at the merchant-controlled destination.

Canonical integration guide: [BTCPay for WooCommerce](https://docs.sprey.win/integrations/btcpay-woocommerce/).

## Cloudflare and outage fallback

The v1 availability design places a Cloudflare Worker in front of `sprey.win`. The Worker tries the WordPress origin on every request and falls back to `sprey-outage.pages.dev` for network errors, the bounded timeout, or selected origin failures.

Configured status coverage is currently:

```text
502 503 504 520 521 522 523 524 525 526
```

Failover and recovery are verified for the full-origin outage path, Caddy stop/start, normal VPS reboot, hard reboot, controlled `525`, and controlled `526` behavior. The `525` path was verified by creating a TLS-handshake failure. The `526` path was verified on an isolated proxied test hostname under Cloudflare **Full (strict)** by temporarily serving a self-signed origin certificate: the direct origin TLS connection succeeded, Cloudflare rejected the invalid certificate, and the Worker returned the static outage page as HTTP `503` with `Cache-Control: no-store`, `Retry-After: 60`, and `X-Sprey-Failover: static-outage-page`. Restoring Caddy returned the next proxied request to normal WordPress as HTTP `200` without the failover header.

See [`cloudflare/README.md`](cloudflare/README.md) for rollout, validation, rollback, and the exact verification boundary.

## Optional phpMyAdmin

phpMyAdmin is intentionally off by default and bound only to `127.0.0.1:8081`.

Verified behavior includes:

- localhost-only publishing;
- SSH-tunnel access and MariaDB login path;
- stop/start lifecycle;
- ARM64 image/start behavior (`linux/arm64`) with local HTTP `200`;
- active-service recovery after a normal host reboot while remaining bound only to `127.0.0.1:8081`.

Use the canonical operations guide for start commands, SSH tunneling, password retrieval, login choices, stop/start steps, and security notes:

[WP Stack phpMyAdmin access](https://docs.sprey.win/operations/wp-stack-phpmyadmin/)

Do not open TCP `8081` publicly.

## Operations

```bash
# Validate and inspect
docker compose config --quiet
docker compose ps
./status.sh
docker compose logs -f caddy

# Update external images and rebuild the storefront.
docker compose pull --ignore-buildable
docker compose build wordpress
docker compose up -d

# Optional safe cleanup after a rebuild.
docker builder prune --all --force
apt-get clean
rm -rf /var/lib/apt/lists/*
```

Do not run `docker compose down -v` on a live stack: it removes named volumes containing the site, database, and Caddy state.

## Update behavior

A new WordPress image build downloads the current stable WooCommerce and BTCPay for WooCommerce V2 releases. Existing site data lives in the persistent `wordpress_data` volume.

The rebuild/recreate path has been explicitly verified with existing plugin files in that persistent volume. A temporary marker plus SHA-256 baselines for WooCommerce `11.1.0` and BTCPay For WooCommerce V2 `2.8.2` survived a WordPress image rebuild and force-recreate unchanged; MariaDB remained healthy and the public site returned HTTP `200`.

This verifies that existing plugin files in `wordpress_data` are preserved across WordPress image rebuild/recreate. It does **not** claim a rollback test after an in-admin upgrade to a newer upstream plugin version, because no newer plugin release was available during that test.

## Documentation and verification rule

Canonical cross-project documentation lives in [`spreywin/sprey-docs`](https://github.com/spreywin/sprey-docs).

The operating rule is simple:

> **Build it. Verify it. Document it.**

**Sprey WP Stack v1.0.0 is the current stable release.** It was published after the targeted infrastructure and deployment checks were completed. A real BTCPay payment flow remains separate payment-product integration work. The plugin rebuild/recreate persistence boundary is verified; an in-admin upgrade-to-newer-version rollback test remains unclaimed because no newer upstream plugin version was available during the test.
