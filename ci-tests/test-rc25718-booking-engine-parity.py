from pathlib import Path
R=Path(__file__).resolve().parent.parent
perm=(R/'booking-permissions.js').read_text(); trip=(R/'trip-runtime.js').read_text(); auth=(R/'booking-authority.js').read_text(); cfg=(R/'trip-config.js').read_text(); idx=(R/'index.html').read_text(); data=(R/'data.js').read_text()
assert "root.BOOKING_PERMISSIONS=Object.freeze" in perm
assert "window.isAdminMode&&window.isAdminMode()" in trip and "BOOKING_PERMISSIONS.canEdit()" in trip
assert 'booking-permissions.js' in idx
assert "mode:'admin'" in cfg and 'bookingMasterRevision: 4' in cfg
assert "if(/^AUD\\b/i.test" in auth
assert 'Airbnb Guidebook' in data
assert 'NZD 628.82' in data and 'NZD 13.95' in data and 'NZD 614.87' in data
print('RC25.7.18 BOOKING ENGINE PARITY: PASS')
