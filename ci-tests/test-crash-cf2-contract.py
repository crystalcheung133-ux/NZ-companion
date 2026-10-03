from pathlib import Path
r=Path(__file__).resolve().parents[1]
sw=(r/'sw.js').read_text()
ms=(r/'moment-sync-runtime.js').read_text()
mo=(r/'moments.js').read_text()
assert "booking-permissions.js" in sw and "generation-selection-adapter.js" in sw and "place-authority.js" in sw and "expense-notification-runtime.js" in sw
assert "if (isJs || isCss) return new Response('', {status:503" in sw
assert "requestedPath !== responsePath" in sw
assert "reconcileCommit(active,deleted,[...readLocal(),...readTombstones()])" in ms
assert "photoSyncedAt" in ms and "photoSyncError:null,updatedAt" not in ms
assert "hasRemoteNewer" in ms and "await window.MOMENT_SYNC.hasRemoteNewer" in mo
assert "resetMomentsEditorState" in mo
print('CF2 CRASH CONTRACT: PASS')
