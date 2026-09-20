from pathlib import Path
R=Path(__file__).resolve().parent.parent
b=(R/'booking-authority.js').read_text()
p=(R/'publication-runtime.js').read_text()
d=(R/'day.html').read_text()
assert "return clone((source&&source[id])||(DEPLOY_MASTER&&DEPLOY_MASTER[id])||null);" in b
assert 'function mergedBookings()' in p
assert 'bookingsData:mergedBookings()' in p
assert "travelengine:bookingchange" in p and "detail.local!==true" in p
assert "reason:'booking-save'" in p
assert 'drive-briefing-note' not in d
print('RC25.7.25 EDITABLE SOURCE CONTRACT: PASS')
