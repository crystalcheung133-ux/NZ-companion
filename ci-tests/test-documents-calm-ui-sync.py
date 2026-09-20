from pathlib import Path
R=Path(__file__).resolve().parent.parent
h=(R/'documents.html').read_text(); j=(R/'documents.js').read_text(); rt=(R/'documents-runtime.js').read_text(); trip=(R/'trip-runtime.js').read_text(); css=(R/'styles.css').read_text()
# Booking attachment experiment must be gone.
for token in ('bookingAttachmentFile','bookingAttachmentsHTML','savePendingBookingAttachment','＋ Attach document'):
 assert token not in trip, token+' remains in booking UX'
# Upload is Companion sheet, one-column form, no linking UX.
assert 'TRIP DOCUMENTS' in h and 'class="docs-form"' in h and 'class="doc-pin-row"' in h
assert 'Link to' in h
assert 'expense-card document-history-card' in j and 'document-category' not in j
assert 'View booking →' not in j
# Viewer owns the full viewport and its own header/body.
assert 'grid-template-rows:auto minmax(0,1fr)' in css and '.doc-viewer-sheet' in css
# Pending upload has durable retry material and sync retries before cloud merge.
assert 'pendingBase64' in rt and 'retryPending(active)' in rt and 'base64ToFile' in rt
print('CALM DOCUMENTS UI + CROSS-DEVICE SYNC CONTRACT: PASS')
