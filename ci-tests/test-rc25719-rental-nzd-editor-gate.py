from pathlib import Path
R=Path(__file__).resolve().parent.parent
d=(R/"data.js").read_text();b=(R/"booking-authority.js").read_text();i=(R/"index.html").read_text();t=(R/"ci-tests/test-documents-browser.py").read_text()
for old in ["AUD 524.66","AUD 11.61","AUD 513.05"]: assert old not in d
for new in ["NZD 628.82","NZD 13.95","NZD 614.87"]: assert new in d
assert "legacyAmounts=new Set(['524.66','11.61','513.05'])" in b
assert "data.js?v=rc25-7-19-rental-nzd-editor-gate" in i
assert "wait_for_selector("#bookingEditForm",state="visible")" in t
print("RC25.7.19 RENTAL NZD + EDITOR GATE: PASS")
