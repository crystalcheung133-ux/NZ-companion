from pathlib import Path
R=Path(__file__).resolve().parent.parent
tr=(R/'trip-runtime.js').read_text();idx=(R/'index.html').read_text();dr=(R/'documents-runtime.js').read_text();ba=(R/'booking-authority.js').read_text();cfg=(R/'trip-config.js').read_text();data=(R/'data.js').read_text()
assert 'documents-runtime.js?v=rc25-7-17-booking-contract' in idx
assert 'function ensureBookingSharedActions' not in tr and 'function finalizeBookingPopup' not in tr
assert tr.count('bookingSharedFooterHTML(booking)') == 3, 'shared footer should have one helper use + Rental Car renderer use only'
assert "return (buttons.length?" in tr and "+bookingSharedFooterHTML(booking);" in tr
assert "${bookingSharedFooterHTML(booking)}${bookingExpenseActionHTML(booking)}" in tr
assert 'function backgroundSync()' in dr and "visibilitychange" in dr
assert 'editableProjection' in ba and 'MASTER_PROTECTED_FIELDS' in ba
assert 'Object.assign({},clone(base),clone(override))' not in ba
assert 'bookingMasterRevision: 4' in cfg
assert 'Airbnb Guidebook' in data
for v in ('NZD 628.82','NZD 13.95','NZD 614.87'): assert v in data
print('RC25.7.17 BOOKING CONTRACT ARCHITECTURE: PASS')
