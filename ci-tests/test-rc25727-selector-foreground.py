from pathlib import Path
root=Path(__file__).resolve().parents[1]
css=(root/'styles.css').read_text(encoding='utf-8')
browser=(root/'ci-tests/test-browser-release-smoke.py').read_text(encoding='utf-8')
release=(root/'RELEASE.json').read_text(encoding='utf-8')
assert '#momentsModal.show{' in css and 'z-index:5006!important' in css, 'Moments shown-state must beat legacy unconditional 30000 cascade'
assert '#mamaModal.show{' in css and 'z-index:7700!important' in css, 'User Selector foreground layer missing'
assert '#tripStudioModal{' in css and 'z-index:7800!important' in css, 'Trip Studio must remain above selector layer'
for context in ['Booking → User Selector','Guide → User Selector','Moments → User Selector','Expense → User Selector']:
    assert context in browser, f'Browser gate missing {context}'
assert "top_owner(page,'#mamaModal .guide-sheet')" in browser, 'Browser gate must hit-test selector foreground ownership'
assert "origin popup did not regain foreground after selector close" in browser, 'Browser gate must verify return to origin'
import json
meta=json.loads(release)
assert meta.get('release')==meta.get('candidate') and str(meta.get('release','')).startswith('RC25.7.'), 'Release metadata is inconsistent'
print('RC25.7.27 CONTRACT: PASS — Booking/Guide/Moments/Expense selector stack is explicitly guarded')
