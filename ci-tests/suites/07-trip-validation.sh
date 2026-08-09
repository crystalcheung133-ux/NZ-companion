#!/bin/sh
set -u
failed=0
echo "== TRIP VALIDATION =="
echo "No trip-specific checks in this capability suite."
[ "$failed" -eq 0 ] || exit 1
echo "TRIP VALIDATION: PASS"
