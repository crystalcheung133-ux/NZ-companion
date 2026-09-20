#!/bin/sh
set -eu
echo "== BROWSER RELEASE SMOKE · RC25.7.25 EDITABLE SOURCE CONTRACT =="
python - <<'PY'
try:
    import playwright
except Exception as e:
    raise SystemExit("BROWSER GATE BLOCKED: Python Playwright is not installed: "+str(e))
PY
python ci-tests/test-browser-release-smoke.py
python ci-tests/test-documents-browser.py
echo "BROWSER RELEASE GATE PASSED"
