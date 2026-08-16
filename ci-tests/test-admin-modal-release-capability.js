const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const htmls = fs.readdirSync(root).filter(f => f.endsWith('.html'));
const fail = [];
function must(re, text, label){ if(!re.test(text)) fail.push(label); }
must(/--admin-modal-layer\s*:\s*7000/, css, 'admin modal layer variable missing');
must(/\.timeline-editor-modal[\s\S]*#tripStudioModal[\s\S]*z-index\s*:\s*7800/, css, 'timeline/studio modal layer contract missing');
must(/\.timeline-editor-actions[\s\S]*position\s*:\s*relative[\s\S]*z-index\s*:\s*3/, css, 'timeline editor action footer protection missing');
must(/#tripStudioModal[\s\S]*safe-area-inset-bottom/, css, 'studio safe-area padding missing');
must(/TRIP_CONFIG\.version/, sw, 'service worker cache identity is not release-version driven');
for(const f of htmls){
  const txt = fs.readFileSync(path.join(root,f),'utf8');
  if(/styles\.css/.test(txt) && !/styles\.css\?v=[^"'\s>]+/.test(txt)) fail.push(`${f}: styles cache key missing`);
}
if(fail.length){ console.error('ADMIN MODAL + RELEASE ASSET CAPABILITY: FAILED'); fail.forEach(x=>console.error('- '+x)); process.exit(1); }
console.log('ADMIN MODAL + RELEASE ASSET CAPABILITY: PASS');
