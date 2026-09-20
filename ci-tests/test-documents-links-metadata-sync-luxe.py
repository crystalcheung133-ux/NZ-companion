from pathlib import Path
R=Path(__file__).resolve().parent.parent
h=(R/'documents.html').read_text();j=(R/'documents.js').read_text();rt=(R/'documents-runtime.js').read_text();css=(R/'styles.css').read_text();data=(R/'data.js').read_text()
assert '<span>Link to</span><select id="docLink">' in h
assert 'id="editDocLink"' in h
assert "label:'Trip-wide'" in j and "Booking · " in j and "Timeline · " in j
assert "routeForDocument" in j and "linkType==='booking'" in j and "linkType==='timeline'" in j
assert "meta.linkType||'trip'" in rt and "meta.linkId||''" in rt
assert "String(d.updatedAt||'')>=String(l.updatedAt||'')" in rt
assert "||!l.uploadPending" not in rt
assert "async function update(id,patch)" in rt and "await cloudWrite(next)" in rt
assert "deleted:true" in rt and "d?.deleted||d?.metaSyncPending" in rt
assert "grid-template-columns:repeat(3,minmax(0,1fr))" in css
assert '"time": "8:00 AM"' in data
assert '"pickupAddress": "225 Milford Road, Te Anau 9600, New Zealand"' in data
assert '"time": "8:55 AM"' not in data
print('DOCUMENT LINKS + METADATA SYNC + LUXE 8AM CONTRACT: PASS')
