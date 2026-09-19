from pathlib import Path
R=Path(__file__).resolve().parent.parent
tr=(R/'trip-runtime.js').read_text(); data=(R/'data.js').read_text(); smoke=(R/'ci-tests/test-browser-release-smoke.py').read_text()
assert 'function bookingSharedFooterHTML' in tr
assert '${bookingSharedFooterHTML(booking)}${bookingExpenseActionHTML(booking)}' in tr
assert "bookingUsefulLinksHTML(booking)+bookingDocumentLinksHTML(booking)+bookingStudioActionHTML(booking)" in tr
assert "Useful link label" in tr and "Useful link URL" in tr
assert 'Airbnb Guidebook' in data and 'guidebooks%2F1804375' in data
for v in ['NZD 628.82','NZD 13.95','NZD 614.87','NZD 1,500 pre-authorisation']:
    assert v in data
assert 'window.openTripStudioPanel()' in smoke
print('RC25.7.15 SHARED BOOKING LINKS + AIRBNB + NZD + STUDIO REENTRY: PASS')
