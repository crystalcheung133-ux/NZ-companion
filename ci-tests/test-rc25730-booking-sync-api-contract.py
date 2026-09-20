from pathlib import Path
b=Path("booking-sync-runtime.js").read_text()
t=Path("trip-runtime.js").read_text()
assert "function enabled()" in b
assert "async function push()" in b
assert "BOOKING_SYNC=Object.freeze({enabled,syncNow,push,queueSync" in b
assert "BOOKING_SYNC.remove" not in t
assert "BOOKING_AUTHORITY.remove(bookingId,liveTarget)" in t
assert "BOOKING_SYNC.push()" in t
print("PASS RC25.7.30 booking sync API contract")
