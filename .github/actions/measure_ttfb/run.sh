#!/usr/bin/env bash
set -euo pipefail

if [ -z "${STAGING_URL:-}" ]; then
  echo "STAGING_URL not set"
  exit 1
fi

ENDPOINT="$STAGING_URL/api/tasks?workspaceId=test&limit=10"
echo "Measuring TTFB for $ENDPOINT"

# use curl to measure time_total and time_connect etc
out=$(curl -sS -w "%{time_starttransfer}" -o /dev/null "$ENDPOINT" || true)
start_transfer=$(echo "$out" | tr -d '\n')
# start_transfer is in seconds (float)
ms=$(echo "$start_transfer * 1000" | bc -l)
ms_int=$(printf "%.0f" "$ms")

echo "TTFB_ms=$ms_int"

THRESHOLD=400
if [ "$ms_int" -gt "$THRESHOLD" ]; then
  echo "TTFB too high: ${ms_int}ms (threshold ${THRESHOLD}ms)"
  exit 1
fi

echo "TTFB ok: ${ms_int}ms"
