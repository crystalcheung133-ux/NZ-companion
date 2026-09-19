from pathlib import Path
R=Path(__file__).resolve().parent.parent
j=(R/'documents.js').read_text(); b=(R/'ci-tests/test-documents-browser.py').read_text()
for token in ('expense-card document-history-card','timestamp','entry-actions document-entry-actions','mini-btn'):
 assert token in j, token+' missing from Documents expense-card reuse'
assert 'identity(p)' not in b
assert 'mamaModal' not in b
assert 'base+"/documents.html"' in b
print('DOCUMENT EXPENSE-CARD UI + DETERMINISTIC BROWSER HARNESS: PASS')
