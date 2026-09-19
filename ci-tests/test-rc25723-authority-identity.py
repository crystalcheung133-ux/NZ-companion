from pathlib import Path
R=Path(__file__).resolve().parent.parent
d=(R/'day.html').read_text(); c=(R/'core-runtime.js').read_text(); b=(R/'ci-tests/test-browser-release-smoke.py').read_text()
assert 'syncDriveSummaryFromRenderedTimeline' in d
assert "if(getStoredFriend()){" in c and "existing.classList.remove('show','identity-required')" in c
assert "identity overlay reopened after valid stored identity" in b
assert "Today drive summary ignored saved Timeline order" in b
assert 'new MutationObserver(settle)' not in b
print('RC25.7.23 AUTHORITY + IDENTITY SOURCE: PASS')
