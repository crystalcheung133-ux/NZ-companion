from pathlib import Path
R=Path(__file__).resolve().parent.parent
css=(R/'styles.css').read_text();docs=(R/'documents.js').read_text();day=(R/'day.html').read_text();b=(R/'ci-tests/test-browser-release-smoke.py').read_text()
assert "z-index:30000!important" in css and "inset:0!important" in css and "height:100dvh!important" in css
assert "travel_engine_return_document_v1" in docs
assert "deriveDayPresentation" in day and "buildOrderedDriveMap" in day
assert "window.setFriend('lee')" in b
print("RC25.7.11/12 MODAL + RETURN + DERIVED DRIVE + IDENTITY: PASS")
