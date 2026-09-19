from pathlib import Path
R=Path(__file__).resolve().parent.parent
rt=(R/'documents-runtime.js').read_text();j=(R/'documents.js').read_text();css=(R/'styles.css').read_text();b=(R/'ci-tests/test-browser-release-smoke.py').read_text()
assert 'function readRaw()' in rt and 'tombstones.has(d.id)' in rt and 'raw.push(tombstone)' in rt
assert 'doc-viewer-linked-entity' in j and "link.href=routeForDocument(d)" in j
close=j[j.index('root.closeDocumentViewer='):j.index('root.resetDocumentsView=')]
assert "if(back){location.href=back;return true}" in close
assert close.index("if(back)") < close.index("classList.remove('show')")
assert '--companion-header-clearance' in css and '--companion-bottom-clearance' in css
assert 'top:var(--companion-header-clearance)!important' in css
assert "page.on('console'" in b and "page.on('requestfailed'" in b and "check(not errors" in b
print('RC25.7.9 ARCHITECTURE CORRECTION: PASS')
