#!/usr/bin/env bash
# Sprey WP Stack resource and disk overview.
set -Eeuo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

section() { printf '\n==> %s\n' "$1"; }

section "Host profile"
HOST_OS="unknown"
if [[ -r /etc/os-release ]]; then
  # shellcheck disable=SC1091
  . /etc/os-release
  HOST_OS="${PRETTY_NAME:-unknown}"
fi
VIRTUALIZATION="$(systemd-detect-virt 2>/dev/null || true)"
[[ -n "$VIRTUALIZATION" ]] || VIRTUALIZATION="none"
CPU_MODEL="$(lscpu | awk -F: '/^Model name:/ { value=$2 } END { gsub(/^[[:space:]]+|[[:space:]]+$/, "", value); print value }')"
TOTAL_RAM="$(free -h | awk '/^Mem:/ { value=$2 } END { print value }')"
TOTAL_SWAP="$(free -h | awk '/^Swap:/ { value=$2 } END { print value }')"
ROOT_DEVICE="$(findmnt -n -o SOURCE /)"
ROOT_SIZE="$(df -hP / | awk 'NR == 2 { value=$2 } END { print value }')"
printf 'Hostname: %s\n' "$(hostname)"
printf 'OS: %s\n' "$HOST_OS"
printf 'Kernel: %s\n' "$(uname -r)"
printf 'Architecture: %s\n' "$(uname -m)"
printf 'Virtualization: %s\n' "$VIRTUALIZATION"
printf 'vCPU: %s\n' "$(nproc)"
printf 'CPU model: %s\n' "${CPU_MODEL:-unknown}"
printf 'RAM: %s\n' "$TOTAL_RAM"
printf 'Swap: %s\n' "$TOTAL_SWAP"
printf 'Root device: %s\n' "$ROOT_DEVICE"
printf 'Root size: %s\n' "$ROOT_SIZE"

section "System uptime and load"
uptime

section "Filesystem usage"
df -hT /

section "Filesystem inode usage"
df -ih /

section "Memory and swap"
free -h

if command -v docker >/dev/null 2>&1; then
  section "Compose services"
  docker compose ps

  section "Container CPU and memory"
  docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}'

  section "Docker disk usage"
  docker system df
else
  printf '\nDocker is not installed or not available in PATH.\n'
fi

printf '\nTip: use "docker system df -v" for a detailed Docker disk breakdown.\n'
