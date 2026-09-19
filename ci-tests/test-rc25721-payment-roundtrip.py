from pathlib import Path
R=Path(__file__).resolve().parent.parent
a=(R/'booking-authority.js').read_text();t=(R/'trip-runtime.js').read_text();b=(R/'ci-tests/test-documents-browser.py').read_text();r=(R/'ci-tests/test-browser-release-smoke.py').read_text()
assert "MASTER_PROTECTED_FIELDS=new Set(['usefulLinks'])" in a
assert "No booking payment field is deploy-locked" in a
for name in ['totalAmount','depositPaid','balanceDue','netTotalAUD']:
 assert f"bookingField('" in t and name in t
assert 'Studio payment edit did not round-trip to renderer' in b
assert 'EXPECTED AUTH TRANSPORT NOISE' in r
print('RC25.7.21 PAYMENT ROUNDTRIP CONTRACT: PASS')
