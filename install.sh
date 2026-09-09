#!/usr/bin/env bash
# Sprey WP Stack bootstrapper for a clean Debian or Ubuntu VPS.
set -Eeuo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

# Resolve the real user who initiated the installation.
# - sudo ./install.sh ...        -> SUDO_USER
# - sudo sh -c 'nohup ...'       -> SUDO_USER inherited by the child
# - direct root execution        -> project directory owner when appropriate
INSTALL_USER="${SUDO_USER:-}"

if [[ -z "$INSTALL_USER" || "$INSTALL_USER" == "root" ]] || ! id "$INSTALL_USER" >/dev/null 2>&1; then
  PROJECT_OWNER="$(stat -c '%U' "$PROJECT_DIR" 2>/dev/null || true)"
  if [[ -n "$PROJECT_OWNER" && "$PROJECT_OWNER" != "UNKNOWN" && "$PROJECT_OWNER" != "root" ]] \
    && id "$PROJECT_OWNER" >/dev/null 2>&1; then
    INSTALL_USER="$PROJECT_OWNER"
  else
    INSTALL_USER="root"
  fi
fi

INSTALL_GROUP="$(id -gn "$INSTALL_USER")"

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
apt-get install -y ca-certificates curl gnupg openssl ufw util-linux

if ! swapon --noheadings --show=NAME 2>/dev/null | grep -q .; then
  note "No active swap detected; creating a 1 GiB swap file"
  SWAP_FILE="/swapfile"
  if [[ -e "$SWAP_FILE" ]]; then
    SWAP_FILE="/swapfile-sprey"
  fi
  if command -v fallocate >/dev/null; then
    fallocate -l 1G "$SWAP_FILE"
  else
    dd if=/dev/zero of="$SWAP_FILE" bs=1M count=1024 status=progress
  fi
  chmod 600 "$SWAP_FILE"
  mkswap "$SWAP_FILE" >/dev/null
  swapon "$SWAP_FILE"
  printf '%s none swap sw 0 0\n' "$SWAP_FILE" >> /etc/fstab
else
  note "Existing swap detected; leaving it unchanged"
fi

ensure_docker_repo() {
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL "https://download.docker.com/linux/$ID/gpg" -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  CODENAME="${VERSION_CODENAME:-$(. /etc/os-release && echo "$VERSION_CODENAME")}" 
  printf 'deb [arch=%s signed-by=%s] https://download.docker.com/linux/%s %s stable\n' \
    "$(dpkg --print-architecture)" "/etc/apt/keyrings/docker.asc" "$ID" "$CODENAME" > /etc/apt/sources.list.d/docker.list
  apt-get update
}

if ! command -v docker >/dev/null; then
  note "Installing Docker Engine and Docker Compose"
  ensure_docker_repo
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
elif ! docker compose version >/dev/null 2>&1; then
  note "Docker Engine detected without Docker Compose v2; installing Compose plugin"
  ensure_docker_repo
  apt-get install -y docker-compose-plugin
fi

docker compose version >/dev/null || fail "Docker Compose v2 is required."

# Allow the real installing user to manage Docker without sudo.
# Group membership becomes active after a new login session.
if [[ "$INSTALL_USER" != "root" ]]; then
  getent group docker >/dev/null || fail "Docker group was not created."
  usermod -aG docker "$INSTALL_USER"
fi

note "Configuring firewall"
# The live connection is the safest source: it preserves a non-standard port.
# If sudo removes SSH_CONNECTION or the script runs from a provider console,
# use sshd's effective config. Read the full output so pipefail cannot turn
# sshd's SIGPIPE into a false installer failure.
SSH_PORT="${SSH_CONNECTION-}"
SSH_PORT="${SSH_PORT##* }"
if [[ ! "$SSH_PORT" =~ ^[0-9]+$ ]]; then
  SSH_PORT="$(sshd -T 2>/dev/null | awk '/^port / && !found { print $2; found=1 }')"
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

# Keep deployment secrets private, but accessible to the real installing user.
if [[ "$INSTALL_USER" != "root" ]]; then
  chown "$INSTALL_USER:$INSTALL_GROUP" "$PROJECT_DIR/.env"
fi
chmod 600 "$PROJECT_DIR/.env"
chmod +x "$PROJECT_DIR/status.sh"

note "Validating and starting Sprey WP Stack"
cd "$PROJECT_DIR"
docker compose config --quiet
docker compose pull --ignore-buildable
docker compose build wordpress
docker compose up -d

note "Removing temporary installation cache"
# The installer targets a clean VPS. Once the runtime image is built and the
# stack is running, BuildKit cache is no longer required for operation.
# Do not prune images, containers, networks, or volumes here.
docker builder prune --all --force >/dev/null || note "Docker build cache cleanup was skipped"
apt-get clean
rm -rf /var/lib/apt/lists/*

printf '\nReady. Caddy will obtain HTTPS automatically after DNS for %s reaches this server.\n' "$DOMAIN"
printf 'WooCommerce and BTCPay for WooCommerce V2 are bundled and ready to activate after WordPress setup.\n'

if [[ "$INSTALL_USER" != "root" ]]; then
  printf 'User %s was added to the docker group. Log out and back in once before using Docker without sudo.\n' "$INSTALL_USER"
fi

printf 'Check stack resources with: cd %s && ./status.sh\n' "$PROJECT_DIR"
