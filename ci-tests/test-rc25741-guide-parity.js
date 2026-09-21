const fs=require('fs');
const s=fs.readFileSync('guide-runtime.js','utf8');
function ok(v,m){if(!v)throw new Error(m)}
ok(s.includes("<h3>About</h3>"),'Guide must render Description as About');
ok(s.includes("guideListSection('Useful info',useful"),'Guide must render Useful info');
ok(s.includes("g.cat!=='STAY'&&hours"),'Stay must not expose legacy check-in/out as Place Hours');
ok(s.includes('🌐 Website'),'Website editor value must have a display/action surface');
const core=s.slice(s.indexOf('function guideCoreSections'),s.indexOf('function quickInfoInnerHTML'));
for(const bad of ['guideStaySections(', 'guideExperienceSections(', 'guideAttractionSections(', 'compactGuideSections(']) ok(!core.includes(bad),'Guide core must not call legacy snapshot renderer: '+bad);
console.log('RC25.7.41 GUIDE DISPLAY/EDIT PARITY: PASS');
