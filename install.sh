#!/usr/bin/env bash
# Sprey WP Stack bootstrapper for a clean Debian or Ubuntu VPS.
set -Eeuo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

fail() { printf '\nError: %s\n' "$*" >&2; exit 1; }
note() { printf '\n==> %s\n' "$*"; }

[[ $EUID -eq 0 ]] || fail "Run as root: sudo ./install.sh DOMAIN EMAIL"
[[ -f /etc/os-release ]] || fail "This installer supports Debian and Ubuntu only."
. /etc/os-release
case "${ID:-}" in debian|ubuntu) ;; *) fail "Unsupported operating system: ${ID:-unknown}" ;; esac

DOMAIN="${1:-}"
EMAIL="${2:-}"
[[ -n "$DOMAIN" ]] || { read -r -p "Domain (example.com): " DOMAIN; }
[[ -n "$EMAIL" ]] || { read -r -p "Let's Encrypt email: " EMAIL; }
[[ "$DOMAIN" =~ ^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$ ]] || fail "Invalid domain."
[[ "$EMAIL" == *"@"*.* ]] || fail "Invalid email address."
[[ ! -e "$PROJECT_DIR/.env" ]] || fail ".env already exists; refusing to overwrite an existing deployment."
command -v openssl >/dev/null || fail "openssl is required but unavailable."

note "Installing prerequisites"
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl gnupg openssl ufw

if ! command -v docker >/dev/null; then
  note "Installing Docker Engine and Docker Compose"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL "https://download.docker.com/linux/$ID/gpg" -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  CODENAME="${VERSION_CODENAME:-$(. /etc/os-release && echo "$VERSION_CODENAME")}" 
  printf 'deb [arch=%s signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/%s %s stable\n' \
    "$(dpkg --print-architecture)" "$ID" "$CODENAME" > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

docker compose version >/dev/null || fail "Docker Compose v2 is required."

note "Configuring firewall"
# The live connection is the safest source: it preserves a non-standard port.
# If the script is run from the provider console, use sshd's effective config.
SSH_PORT="${SSH_CONNECTION-}"
SSH_PORT="${SSH_PORT##* }"
if [[ ! "$SSH_PORT" =~ ^[0-9]+$ ]]; then
  SSH_PORT="$(sshd -T 2>/dev/null | awk '/^port / { print $2; exit }')"
fi
[[ "$SSH_PORT" =~ ^[0-9]+$ ]] && (( SSH_PORT >= 1 && SSH_PORT <= 65535 )) || \
  fail "Cannot determine the active SSH port; UFW was not changed."
ufw default deny incoming
ufw default allow outgoing
ufw allow "${SSH_PORT}/tcp" comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw allow 443/udp comment 'HTTP/3'
ufw --force enable

note "Creating private deployment configuration"
cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
set_env() {
  local key="$1" value="$2"
  sed -i "s|^${key}=.*|${key}=${value}|" "$PROJECT_DIR/.env"
}
set_env DOMAIN "$DOMAIN"
set_env ACME_EMAIL "$EMAIL"
set_env MYSQL_PASSWORD "$(openssl rand -hex 32)"
set_env MYSQL_ROOT_PASSWORD "$(openssl rand -hex 32)"
chmod 600 "$PROJECT_DIR/.env"

note "Validating and starting Sprey WP Stack"
cd "$PROJECT_DIR"
docker compose config --quiet
docker compose pull
docker compose up -d

printf '\nReady. Caddy will obtain HTTPS automatically after DNS for %s reaches this server.\n' "$DOMAIN"
printf 'Check status with: cd %s && docker compose ps\n' "$PROJECT_DIR"
