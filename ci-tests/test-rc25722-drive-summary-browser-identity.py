from pathlib import Path
R=Path(__file__).resolve().parent.parent
d=(R/'day.html').read_text(); b=(R/'ci-tests/test-browser-release-smoke.py').read_text(); db=(R/'ci-tests/test-documents-browser.py').read_text()
assert 'data-drive-summary="timeline-order"' in d
assert 'drive.route=stops.join(\' → \')' in d
assert 'workingItems=getDayItems(day);' in d
assert "MutationObserver(settle)" in b and "localStorage.setItem('nz_friend','lee')" in b
assert 'def new_context(browser,viewport):' in db and 'MutationObserver(settle)' in db
assert 'Seed a stale pre-fix booking snapshot' not in db
print('RC25.7.22 DRIVE SUMMARY + BROWSER IDENTITY: PASS')
