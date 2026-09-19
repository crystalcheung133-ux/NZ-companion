from pathlib import Path
R=Path(__file__).resolve().parent.parent
tr=(R/'trip-runtime.js').read_text();b=(R/'ci-tests/test-browser-release-smoke.py').read_text();pub=(R/'publication-runtime.js').read_text();css=(R/'styles.css').read_text();sync=(R/'sync-runtime.js').read_text()
assert "TRIP_MODAL_RETURN_TARGET" in tr
assert "params.get('returnTo')" in tr
assert "window.TRIP_MODAL_RETURN_TARGET||" in tr
assert "page.wait_for_function(\"typeof window.setFriend==='function'" in b
assert "window.setFriend(k)" in b and "identity overlay still intercepts pointer events" in b
assert "select_admin(page)" in b
assert "hasTimeline" in pub and "publish({silent:true,reason:'timeline-save'})" in pub
assert "fetchLatestPublished()" in sync and "startAutoRead" in sync
assert "--companion-bottom-clearance:128px" in css and "bottom:var(--companion-bottom-clearance)!important" in css
print('RC25.7.10 RETURN + IDENTITY + TIMELINE CLOUD SYNC: PASS')
