from pathlib import Path
R=Path(__file__).resolve().parent.parent
j=(R/'documents.js').read_text();trip=(R/'trip-runtime.js').read_text();day=(R/'day.html').read_text();browser=(R/'ci-tests/test-browser-release-smoke.py').read_text()
assert 'devicePixelRatio' in j and 'cssScale*dpr' in j and "canvas.style.width" in j
assert "get('returnTo')" in j
assert "returnTo=${encodeURIComponent('trip.html?bookingId='+booking.id)}" in trip
assert "returnTo=${encodeURIComponent('day.html?day='+day+'#'+item.id)}" in day
assert "item.id==='wanaka-dinner'" in day
assert "page.wait_for_selector('#mamaModal.show')\n      admin_key" not in browser
print('DOCUMENT RETURN + HIDPI + EDGEWATER NAV CONTRACT: PASS')
