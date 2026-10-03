const fs=require('fs'),assert=require('assert');
function strip(s){return s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:])\/\/.*$/gm,'$1');}
function body(src,signature){
  const start=src.indexOf(signature); assert(start>=0,`missing ${signature}`);
  const brace=src.indexOf('{',start); let depth=0, quote=null, esc=false;
  for(let i=brace;i<src.length;i++){const c=src[i];if(quote){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===quote)quote=null;continue;}if(c==='"'||c==="'"||c==='`'){quote=c;continue;}if(c==='{')depth++;else if(c==='}'&&--depth===0)return src.slice(brace+1,i);}throw new Error(`unterminated ${signature}`);
}
const sync=strip(fs.readFileSync('moment-sync-runtime.js','utf8'));
const moments=strip(fs.readFileSync('moments.js','utf8'));
const sw=strip(fs.readFileSync('sw.js','utf8'));
const syncNow=body(sync,'async function syncNow()');
assert(/await\s+flushPhotos\s*\(\s*\)/.test(syncNow),'W1: syncNow must await production flushPhotos');
const save=body(moments,'window.saveMoments = async function()');
assert(/await\s+window\.MOMENT_SYNC\.hasRemoteNewer\s*\(/.test(save),'W2: edit Save must await production conflict check');
assert(/momentSavePendingSessions\.has\s*\(\s*momentEditorSession\s*\)/.test(save),'M5c: Save entry must enforce current-session single-flight lock');
assert(/momentSavePendingSessions\.add\s*\(\s*sessionAtStart\s*\)/.test(save),'Save must lock launching session');
const finallyBlock=save.match(/finally\s*\{([\s\S]*)$/); assert(finallyBlock,'Save finally block missing');
assert(/momentSavePendingSessions\.delete\s*\(\s*sessionAtStart\s*\)/.test(finallyBlock[1]),'Save must release only launching session');
assert(/sessionAtStart\s*===\s*momentEditorSession\s*&&\s*save/.test(finallyBlock[1]),'M5b: stale Save finally must not touch a newer editor');
const nav=body(sw,'async function navigationResponse(request)');
assert(/await\s+fetchValidHtml\s*\(\s*request\s*\)/.test(nav),'W3: navigationResponse must pass network HTML through fetchValidHtml');
assert(/cachedValidHtml\s*\(\s*request\s*\)/.test(nav),'navigationResponse must use validated cached fallback');
console.log('CF4.1 PRODUCTION WIRING: PASS');
