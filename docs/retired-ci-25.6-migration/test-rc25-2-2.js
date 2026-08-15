const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const data=fs.readFileSync(path.join(root,'data.js'),'utf8');
const guide=fs.readFileSync(path.join(root,'guide-runtime.js'),'utf8');
const day=fs.readFileSync(path.join(root,'day.html'),'utf8');
function assert(cond,msg){if(!cond){console.error('FAIL:',msg);process.exitCode=1;}else console.log('PASS:',msg);}
assert(/"ACTIVITIES"\s*:\s*\[\s*\{\s*"key"\s*:\s*"ultimate-alpine"/.test(data),'Ultimate Alpine appears in Activities category');
assert(/"glenorchy-paradise",\s*"ultimate-alpine",\s*"hooker-valley"/.test(data),'Ultimate Alpine appears in canonical guide order');
assert(data.includes('"routeOptions"')&&data.includes('"label": "Crown Range"')&&data.includes('"label": "Via Cromwell"'),'Day 4 exposes both Wānaka→Queenstown route options');
assert(day.includes('timeline-action--route-option')&&day.includes('routeOptionsHtml'),'Timeline renders route-option buttons');
assert(guide.includes('function guideCoreSections')&&guide.includes('${coreSections}'),'Guide core content is integrated into the main quick-info card');
assert(!guide.includes('${quickInfoHTML(g,key)}${guideStaySections'),'Guide modal does not duplicate core sections below the main card');
if(!process.exitCode)console.log('RC25.2.2 CONTRACT: PASS — route options, guide hierarchy and Alpine category are consistent.');
