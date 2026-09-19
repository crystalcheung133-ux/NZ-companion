from pathlib import Path
R=Path(__file__).resolve().parent.parent
h=(R/'documents.html').read_text();j=(R/'documents.js').read_text();c=(R/'styles.css').read_text();b=(R/'ci-tests/test-documents-browser.py').read_text()
assert '>Edit</button>' in j
assert 'openEditDocument' in j and 'saveDocumentEdit' in j and 'Save Changes' in h
assert 'id="editDocModal"' in h
assert 'doc-viewer-head"><span aria-hidden="true"></span><strong id="docViewerTitle"' in h
assert 'grid-column:3!important;justify-self:end!important' in c
assert 'openDocumentViewer' in b and 'Edit action missing' in b and 'viewer Close is not on the right' in b
print('DOCUMENT EDIT + VIEWER RIGHT-CLOSE CONTRACT: PASS')
