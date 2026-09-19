from pathlib import Path
import re,collections
R=Path(__file__).resolve().parent.parent
h=(R/'documents.html').read_text(); rt=(R/'documents-runtime.js').read_text(); j=(R/'documents.js').read_text()
srcs=re.findall(r'<script[^>]+src="([^"]+)"',h)
base=[re.sub(r'\?.*','',x) for x in srcs]
dups=[x for x,n in collections.Counter(base).items() if n>1]
assert not dups,'duplicate Documents scripts: '+repr(dups)
assert base.count('data.js')==1
assert 'async function repair(id,file)' in rt and 'repair,update,remove' in rt
assert 'legacyLocalOnly:true' in rt
assert 'Choose file to sync' in j and 'Not synced' in j
print('DOCUMENTS RUNTIME + LEGACY CLOUD REPAIR: PASS')
