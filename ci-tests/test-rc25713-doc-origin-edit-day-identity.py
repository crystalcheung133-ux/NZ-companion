from pathlib import Path
R=Path(__file__).resolve().parent.parent
j=(R/'documents.js').read_text();d=(R/'day.html').read_text();css=(R/'styles.css').read_text()
assert "function routeForDocument(d,origin='page')" in j
assert "origin==='viewer'?`documents.html?document=" in j
assert "routeForDocument(d,'page')" in j and "routeForDocument(d,'viewer')" in j
assert 'travel_engine_return_document_v1' not in j.split('function routeForDocument',1)[1].split('function render',1)[0]
assert 'document-file-name' not in j
save=j[j.index('root.saveDocumentEdit='):j.index('root.repairDocument=')]
assert save.index('root.closeEditDocument()') < save.index('TRIP_DOCUMENTS.update')
assert 'timeline-day-identity' in d and "replace(/•/g,'·')" in d
assert '.timeline-day-identity' in css
print('RC25.7.13 DOC ORIGIN + EDIT + DAY IDENTITY: PASS')
