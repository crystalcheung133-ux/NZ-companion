#!/bin/sh
set -eu
echo "== BROWSER RELEASE SMOKE =="
python - <<'PY'
try:
    import playwright
except Exception as e:
    raise SystemExit("BROWSER GATE BLOCKED: Python Playwright is not installed: "+str(e))
PY
python ci-tests/test-browser-release-smoke.py
echo "BROWSER RELEASE GATE PASSED"
