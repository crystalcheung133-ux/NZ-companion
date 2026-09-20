from pathlib import Path
b=Path('booking-sync-runtime.js').read_text()
d=Path('documents-runtime.js').read_text()
p=Path('publication-runtime.js').read_text()
c=Path('sync-config.js').read_text()
assert "bookings:'trip_bookings'" in c
assert "setInterval(()=>{if(document.visibilityState==='visible')syncNow();},30000)" in b
assert "visibilitychange" in b and "travelengine:bookingchange" in b
assert "replaceState" in Path('booking-authority.js').read_text()
assert "root.setInterval?.(()=>{if(document.visibilityState==='visible')backgroundSync()},30000)" in d
assert "ownerKey:currentUser()" in d and "canManage" in d and "canLink" in d
assert "reason:'timeline-save'" not in p and "reason:'booking-save'" not in p
print('RC25.7.28 cross-device sync contract: PASS')
