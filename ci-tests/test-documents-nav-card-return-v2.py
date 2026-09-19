from pathlib import Path
R=Path(__file__).resolve().parent.parent
j=(R/'documents.js').read_text();rt=(R/'documents-runtime.js').read_text();trip=(R/'trip-runtime.js').read_text();script=(R/'script.js').read_text();b=(R/'ci-tests/test-documents-browser.py').read_text()
assert 'document-title-open' in j
assert '>📄 Open</button>' not in j
assert "✏️ Edit" in j and "🗑 Delete" in j
assert "d.seeded?'':" not in j
assert "if(d?.seeded)return false" not in rt
assert "returnTo=${encodeURIComponent(back)}" in j
assert "const deepReturn=new URLSearchParams(window.location.search).get('returnTo')" in trip
assert 'openGlobalDocuments' not in script and 'closeGlobalDocuments' not in script
assert "check_docs_first_click" in b and "first Docs click did not open Documents" in b
print('DOCUMENT NAV + TITLE OPEN + ALL DELETE + RETURN V2: PASS')
