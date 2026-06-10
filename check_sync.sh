#!/bin/bash

SERVICES=(
  "pm_svc_auth:svc-auth"
  "pm_svc_project:svc-project"
  "pm_svc_workload:svc-workload"
  "pm_svc_notification:svc-notification"
  "pm_svc_reporting:svc-reporting"
  "pm_svc_storage:svc-storage"
)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

ROOT=~/dev/agrawork
DIRS_TO_CHECK=("app" "routes" "config" "database")

echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Docker ↔ Host Sync Checker                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

total_diff=0

for entry in "${SERVICES[@]}"; do
  CONTAINER="${entry%%:*}"
  SERVICE="${entry##*:}"
  HOST_PATH="$ROOT/$SERVICE"

  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}  Service: $SERVICE  [$CONTAINER]${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  svc_diff=0

  for DIR in "${DIRS_TO_CHECK[@]}"; do
    HOST_DIR="$HOST_PATH/$DIR"
    CONTAINER_DIR="/var/www/html/$DIR"

    [ ! -d "$HOST_DIR" ] && continue

    HOST_FILES=$(find "$HOST_DIR" -type f -name "*.php" | sort)
    HOST_COUNT=$(echo "$HOST_FILES" | grep -c . 2>/dev/null || echo 0)

    CONTAINER_COUNT=$(docker exec "$CONTAINER" sh -c "find $CONTAINER_DIR -type f -name '*.php' 2>/dev/null | wc -l" 2>/dev/null | tr -d ' ')

    echo -e "\n  ${YELLOW}[$DIR]${NC} Host: ${HOST_COUNT} files | Container: ${CONTAINER_COUNT} files"

    if [ "$HOST_COUNT" != "$CONTAINER_COUNT" ]; then
      echo -e "  ${RED}⚠ FILE COUNT MISMATCH!${NC}"
      svc_diff=$((svc_diff + 1))
      total_diff=$((total_diff + 1))
    fi

    while IFS= read -r host_file; do
      [ -z "$host_file" ] && continue
      rel_path="${host_file#$HOST_PATH/}"
      container_file="/var/www/html/$rel_path"

      host_lines=$(wc -l < "$host_file" 2>/dev/null || echo 0)
      container_lines=$(docker exec "$CONTAINER" sh -c "wc -l < $container_file 2>/dev/null || echo 0" 2>/dev/null | tr -d ' ')

      if [ "$host_lines" != "$container_lines" ]; then
        echo -e "  ${RED}✗ DIFF${NC} $rel_path"
        echo -e "    Host: ${host_lines} lines | Container: ${container_lines} lines"
        svc_diff=$((svc_diff + 1))
        total_diff=$((total_diff + 1))
      fi
    done <<< "$HOST_FILES"

  done

  for EXTRA in "bootstrap/app.php" "routes/api.php"; do
    host_file="$HOST_PATH/$EXTRA"
    container_file="/var/www/html/$EXTRA"
    [ ! -f "$host_file" ] && continue
    host_lines=$(wc -l < "$host_file")
    container_lines=$(docker exec "$CONTAINER" sh -c "wc -l < $container_file 2>/dev/null || echo 0" 2>/dev/null | tr -d ' ')
    if [ "$host_lines" != "$container_lines" ]; then
      echo -e "\n  ${RED}✗ DIFF${NC} $EXTRA"
      echo -e "    Host: ${host_lines} lines | Container: ${container_lines} lines"
      svc_diff=$((svc_diff + 1))
      total_diff=$((total_diff + 1))
    fi
  done

  if [ "$svc_diff" -eq 0 ]; then
    echo -e "\n  ${GREEN} Semua file sync${NC}"
  else
    echo -e "\n  ${RED} $svc_diff perbedaan ditemukan${NC}"
  fi

  echo ""
done

echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
if [ "$total_diff" -eq 0 ]; then
  echo -e "${BLUE}║  ${GREEN} SEMUA SERVICE SYNC tidak ada perbedaan          ${BLUE}║${NC}"
else
  echo -e "${BLUE}║  ${RED} TOTAL $total_diff PERBEDAAN DITEMUKAN di semua service   ${BLUE}║${NC}"
fi
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
