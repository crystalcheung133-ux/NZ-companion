from pathlib import Path
R=Path(__file__).resolve().parent.parent
trip=(R/'trip-runtime.js').read_text();docs=(R/'documents.js').read_text();idx=(R/'index.html').read_text();triphtml=(R/'trip.html').read_text();day=(R/'day.html').read_text();browser=(R/'ci-tests/test-browser-release-smoke.py').read_text();docbrowser=(R/'ci-tests/test-documents-browser.py').read_text()
assert "index.html?bookingId=" in trip and "trip.html?bookingId=" not in trip[trip.index('function bookingDocumentLinksHTML'):trip.index('function bookingActionButtonsHTML')]
assert "return `index.html?bookingId=" in docs
assert "q.get('bookingId')" in idx.split('</head>')[0] and 'handoff-prepaint' in idx.split('</head>')[0]
assert "location.replace('index.html'" in triphtml
assert 'day-page-hero' not in day[day.index('root.innerHTML='):day.index('root.innerHTML=')+500]
assert 'buildOrderedDriveMap' in day and "maps/dir/?" in day and "waypoints.join('|')" in day
assert 'open_selector' not in browser and 'page.evaluate("()=>window.setAdminMode(true)")' in browser
assert 'def identity(p):' in docbrowser and 'identity(p)' in docbrowser
print('RC25.7.12 NAVIGATION + FULL DRIVE + BROWSER BOOTSTRAP: PASS')
