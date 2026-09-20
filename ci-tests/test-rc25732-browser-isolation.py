from pathlib import Path
R=Path(__file__).resolve().parent.parent
c=(R/'sync-config.js').read_text()
b=(R/'ci-tests/test-documents-browser.py').read_text()
assert "typeof runtimeOverride.enabled==='boolean'" in c
assert "window.TRAVEL_ENGINE_SUPABASE={enabled:false}" in b
assert "trip_documents?select" not in b
print('RC25.7.32 BROWSER CLOUD ISOLATION CONTRACT: PASS')
