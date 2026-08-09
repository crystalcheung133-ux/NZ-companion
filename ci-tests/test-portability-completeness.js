const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),p=JSON.parse(fs.readFileSync(path.join(__dirname,'portability-profile.json'),'utf8'));
const dirs=new Set(['ci-tests','.github','node_modules']);
const excl=new Set(['data.js','trip-config.js','locale-config.js','geo-config.js','theme-config.js','asset-config.js','navigation-config.js','money-config.js','storage-config.js','sync-config.js','shopping-directory-data.js']);
function walk(d,o=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(dirs.has(e.name))continue;const f=path.join(d,e.name);e.isDirectory()?walk(f,o):o.push(f);}return o;}
function rx(t){const e=String(t).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp(`(^|[^A-Za-z0-9_])${e}([^A-Za-z0-9_]|$)`,'i');}
const files=walk(root).filter(f=>['.html','.js'].includes(path.extname(f))&&!excl.has(path.basename(f))),bad=[];
for(const f of files){const rel=path.relative(root,f),s=fs.readFileSync(f,'utf8');
 for(const t of p.forbidden_tokens)if(rx(t).test(s))bad.push(`${rel}: cross-trip residue "${t}"`);
 for(const t of p.identity_tokens)if(rx(t).test(s))bad.push(`${rel}: identity literal "${t}" outside trip source-of-truth`);
 if(path.extname(f)==='.html'){
   if(/<span class=["']family-name["']>\s*[^<]+\s*<\/span>/i.test(s))bad.push(`${rel}: pre-rendered family-name`);
   if(/data-family=["'][^"']+["']/i.test(s))bad.push(`${rel}: hardcoded data-family`);
   if(/data-brand-text=["']familyLabel["'][^>]*>\s*[^<]+\s*</i.test(s))bad.push(`${rel}: hardcoded familyLabel fallback`);
 }}
const ig=path.join(root,'.vercelignore');
if(!fs.existsSync(ig))bad.push('.vercelignore missing'); else {const s=fs.readFileSync(ig,'utf8');for(const x of ['*.md','*.sql','ci-tests/','.github/','SHA256SUMS.txt','PRODUCTION-FILE-MANIFEST.txt'])if(!s.includes(x))bad.push(`.vercelignore missing ${x}`);}
if(bad.length){console.error('PORTABILITY COMPLETENESS: FAILED');bad.forEach(x=>console.error('- '+x));process.exit(1);}
console.log(`PORTABILITY COMPLETENESS: PASS — ${files.length} shared runtime files clean`);
