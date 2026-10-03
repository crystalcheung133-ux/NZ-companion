from pathlib import Path
root=Path(__file__).resolve().parents[1]
sw=(root/'sw.js').read_text(encoding='utf-8')
mom=(root/'moments.js').read_text(encoding='utf-8')
css=(root/'styles.css').read_text(encoding='utf-8')
# Multi-page navigation must never substitute Home for another route.
nav=sw[sw.index('async function navigationResponse'):sw.index('async function networkFirst')]
assert "indexRequest" not in nav and "indexResponse" not in nav, 'navigation fallback still substitutes index.html'
assert 'cachedValidHtml(request)' in nav, 'requested route cache fallback missing'
# Keyboard/visualViewport bursts must not force synchronous layout while editing.
assert "modal?.classList.contains('show')" in mom and "/^(INPUT|TEXTAREA|SELECT)$/" in mom, 'Moment editor viewport guard missing'
assert 'void nav.offsetHeight' not in mom, 'forced synchronous nav reflow remains'
# Concurrent same-Moment edits must be version guarded.
assert 'editingMomentBaseUpdatedAt' in mom and 'commitMomentEdit' in mom and 'momentSavePending' in mom, 'Moment optimistic concurrency/save guard missing'
# Foreground hierarchy must be monotonic.
assert '#momentsModal.show{\n  z-index:30000!important;' in css
assert '#mamaModal.show{\n  z-index:31000!important;' in css
assert '#tripStudioModal{' in css and 'z-index:32000!important;' in css
print('CRASH REGRESSION CONTRACT: PASS — own-route navigation, stable Moment viewport, edit conflict guard, modal hierarchy')
