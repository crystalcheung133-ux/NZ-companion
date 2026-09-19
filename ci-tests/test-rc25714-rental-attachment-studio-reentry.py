from pathlib import Path
R=Path(__file__).resolve().parent.parent
tr=(R/'trip-runtime.js').read_text();doc=(R/'documents.js').read_text();b=(R/'ci-tests/test-browser-release-smoke.py').read_text();db=(R/'ci-tests/test-documents-browser.py').read_text()
assert 'function canonicalBookingId' in tr
assert "canonicalBookingId(d.linkId)===bookingId" in tr
assert "booking|'+canonical" in doc
assert "page.locator('.friend-pill').click()" not in b
assert 'window.setAdminMode(true)' in b
assert "d.linkId='car-rental'" in db and "Rental Car linked attachment missing" in db
print('RC25.7.14 RENTAL ATTACHMENT + STUDIO REENTRY: PASS')
