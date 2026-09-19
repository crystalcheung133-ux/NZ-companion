from pathlib import Path
R=Path(__file__).resolve().parent.parent
d=(R/'day.html').read_text()
b=(R/'ci-tests/test-browser-release-smoke.py').read_text()
assert 'function syncDriveSummaryFromRenderedTimeline' not in d
assert 'const presented=deriveDayPresentation(data,workingItems);' in d
assert 'studio_login(page)' in b
assert "markAdminDirty intentionally rejects writes outside Studio" in b
assert "getDayOverrideItems('3').map(x=>x.id)" in b
print('RC25.7.24 AUDITED TIMELINE AUTHORITY: PASS')
