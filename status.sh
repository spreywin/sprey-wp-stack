#!/usr/bin/env bash
# Sprey WP Stack resource and disk overview.
set -Eeuo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

section() { printf '\n==> %s\n' "$1"; }

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
