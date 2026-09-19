from pathlib import Path
R=Path(__file__).resolve().parent.parent
tr=(R/'trip-runtime.js').read_text();data=(R/'data.js').read_text();cfg=(R/'trip-config.js').read_text();ba=(R/'booking-authority.js').read_text()
assert "function finalizeBookingPopup" in tr and "ensureBookingSharedActions(bookingId)" in tr
assert "if(key==='vehicle')" in tr and "finalizeBookingPopup(car.id)" in tr
assert "✏️ Edit Booking" in tr
assert "Airbnb Guidebook" in data
assert "NZD 628.82" in data and "NZD 13.95" in data and "NZD 614.87" in data
assert "AUD 524.66" not in data and "AUD 11.61" not in data and "AUD 513.05" not in data
assert "bookingMasterRevision: 2" in cfg
print("RC25.7.16 PRODUCTION BOOKING ACTIONS: PASS")
