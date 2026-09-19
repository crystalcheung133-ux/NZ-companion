from pathlib import Path
R=Path(__file__).resolve().parent.parent
b=(R/"booking-authority.js").read_text(); d=(R/"documents-runtime.js").read_text(); t=(R/"ci-tests/test-documents-browser.py").read_text(); rb=(R/"ci-tests/run-browser.sh").read_text()
assert "function enforceDeployInvariants" in b and "base.id==='car-rental'" in b
assert "SEEDED_LINK_AUTHORITY" not in d
assert "Locator.evaluate" not in t and ".evaluate("#bookingEditForm")" not in t
assert 'wait_for_selector("#bookingEditForm",state="visible")' in t
assert "TRIP_DOCUMENTS.update(id,{linkType:'booking'" not in t
assert "CI Rental Attachment" in t
assert "RC25.7.20 SOURCE-OF-TRUTH" in rb
print("RC25.7.20 SOURCE OF TRUTH: PASS")
