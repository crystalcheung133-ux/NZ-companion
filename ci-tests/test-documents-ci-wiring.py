from pathlib import Path
R=Path(__file__).resolve().parent
assert 'test-documents-page-contract.py' in (R/'run-all.sh').read_text()
assert 'test-documents-browser.py' in (R/'run-browser.sh').read_text()
print('DOCUMENTS CI WIRING: PASS')
