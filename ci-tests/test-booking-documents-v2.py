from pathlib import Path
R=Path(__file__).resolve().parent.parent
t=(R/'trip-runtime.js').read_text(); d=(R/'documents-runtime.js').read_text(); j=(R/'documents.js').read_text()
assert '＋ Attach document' in t and 'bookingAttachmentFile' in t
assert 'savePendingBookingAttachment(form,outcome.booking||next)' in t
assert "linkType:'booking'" in t and "linkId:booking.id" in t
assert 'function byBooking(bookingId)' in d and 'byBooking' in d
assert "d.linkType==='booking'" in j and 'bookingMeta(d)' in j
assert 'View booking →' in j and 'trip.html?bookingId=' in j
assert "Remove this attachment from the booking and Documents?" in t
assert "targets()" not in j
print('BOOKING ↔ DOCUMENTS V2 CONTRACT: PASS')
