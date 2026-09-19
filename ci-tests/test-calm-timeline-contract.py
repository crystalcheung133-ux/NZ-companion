from pathlib import Path
R=Path(__file__).resolve().parent.parent
d=(R/'day.html').read_text(); c=(R/'styles.css').read_text()
assert 'timeline-context' in d
assert 'detailLines.slice(1)' in d
assert '<details class="timeline-more">' in d
assert 'timeline-more-route' in d
assert '.timeline-actions{display:flex!important' in c
assert '-webkit-line-clamp:2' in c
print('CALM TIMELINE CONTRACT: PASS')
