from pathlib import Path
R=Path(__file__).resolve().parent.parent
b=(R/'booking-authority.js').read_text()
p=(R/'publication-runtime.js').read_text()
d=(R/'day.html').read_text()
assert "return clone((source&&source[id])||(DEPLOY_MASTER&&DEPLOY_MASTER[id])||null);" in b
assert 'function mergedBookings()' in p
assert 'bookingsData:mergedBookings()' in p
assert "travelengine:bookingchange" not in p
assert "reason:'booking-save'" not in p and "booking-sync-runtime.js" in open('index.html', encoding='utf-8').read()
assert 'drive-briefing-note' not in d
print('RC25.7.25 EDITABLE SOURCE CONTRACT: PASS')
