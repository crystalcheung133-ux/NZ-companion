#!/usr/bin/env python3
from pathlib import Path
import re
R=Path(__file__).resolve().parent.parent
s=(R/"documents.js").read_text()
close=s.rfind("})(globalThis);")
assert close>=0,"documents.js IIFE close missing"
tail=s[close+len("})(globalThis);"):]
assert not re.search(r"\broot\.",tail),"documents.js references IIFE-scoped root after IIFE close"
assert "window.addEventListener('pageshow'" in s[:close],"pageshow reset listener must live inside Documents IIFE"
print("DOCUMENTS JS SCOPE: PASS")
