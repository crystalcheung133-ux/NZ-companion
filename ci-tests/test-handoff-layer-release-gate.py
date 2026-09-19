from pathlib import Path
R=Path(__file__).resolve().parent.parent
trip=(R/'trip.html').read_text();docs=(R/'documents.html').read_text();tr=(R/'trip-runtime.js').read_text();dj=(R/'documents.js').read_text();css=(R/'styles.css').read_text();b=(R/'ci-tests/test-browser-release-smoke.py').read_text()
assert "handoff-prepaint" in trip and "bookingId" in trip
assert "handoff-prepaint" in docs and "document" in docs
assert "handoff-ready" in tr and "handoff-ready" in dj
assert "z-index:9000!important" in css and "z-index:9200!important" in css
assert "localStorage.setItem('nz_friend','lee')" in b
assert "select_admin(page)" in b
print("HANDOFF + FOREGROUND + RELEASE IDENTITY CONTRACT: PASS")
