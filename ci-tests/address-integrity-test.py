import json,re,pathlib
DATA_JS=pathlib.Path(__file__).resolve().parent.parent / "data.js"
s=DATA_JS.read_text(encoding="utf-8")
a=s.index("const PLACES=")+len("const PLACES="); b=s.index("\n\nconst CATEGORIES=",a)
p=json.loads(s[a:b].rstrip(";"))
allowed={"glenorchy-paradise","queenstown-central","te-anau","lake-tekapo-village","christchurch-cbd-discovery-walk"}
bad=[]
for k,v in p.items():
    if k in allowed: continue
    if k not in json.loads(s[s.index("const GUIDE_ORDER=")+len("const GUIDE_ORDER="):s.index("\n\nconst DAY_LINKS=")].rstrip(";")): continue
    addr=(v.get("address") or "").strip()
    if addr in {"Queenstown, New Zealand","Te Anau, New Zealand","Lake Tekapo, Canterbury, New Zealand","Fiordland, New Zealand","Arrowtown, New Zealand"}: bad.append((k,addr))
assert not bad, bad
print("Guide address integrity: PASS")
