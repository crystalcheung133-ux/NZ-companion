#!/usr/bin/env python3
from pathlib import Path
import re
R=Path(__file__).resolve().parent.parent
def ck(x,m):
 if not x: raise AssertionError(m)
d=(R/"documents.html").read_text()
js=(R/"documents.js").read_text()
css=(R/"styles.css").read_text()
ck('href="documents.html"' in d,"Docs nav missing direct documents.html href")
ck('id="docModal"' in d and 'id="docViewer"' in d,"document modal/viewer missing")
ck('globalDocsModal' not in d,"legacy global docs overlay remains on Documents page")
ck('openGlobalDocuments' not in d,"legacy global docs handler remains on Documents page")
ck("root.openAddDocument=()=>{$('docModal').classList.add('show')" in js,"Upload does not explicitly open docModal")
ck("root.openDocumentViewer=id=>" in js and "$('docViewer').classList.add('show')" in js,"Open document does not explicitly show viewer")
ck(re.search(r'body\.documents-page \.docs-modal\{[^}]*display:none!important',css,re.S),"docModal has no hard initial hidden contract")
ck(re.search(r'body\.documents-page \.docs-modal\.show\{[^}]*display:flex!important',css,re.S),"docModal show contract missing")
ck(re.search(r'body\.documents-page \.doc-viewer\{[^}]*display:none!important',css,re.S),"viewer has no hard initial hidden contract")
ck(re.search(r'body\.documents-page \.doc-viewer\.show\{[^}]*display:grid!important',css,re.S),"viewer show contract missing")
for p in R.glob("*.html"):
 t=p.read_text()
 if 'class="app-nav"' in t:
  ck('href="documents.html"' in t,f"{p.name}: Docs is not a direct page link")
  ck('openGlobalDocuments();return false;' not in t,f"{p.name}: legacy Docs click handler remains")
  ck('id="globalDocsModal"' not in t,f"{p.name}: legacy Docs overlay remains")
print("DOCUMENTS PAGE CONTRACT: PASS")
