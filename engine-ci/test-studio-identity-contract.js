const fs=require('fs');
const a=fs.readFileSync('runtime/admin.js','utf8');
const fail=[];
if(!a.includes("const modal=getTripStudioModal()"))fail.push('Studio re-entry must use dedicated Studio modal');
if(a.includes('sheet.scrollTop + (studioRect.top - sheetRect.top)'))fail.push('Studio re-entry still depends on sheet scroll ownership');
for(const token of ['setStoredMode(false);','lockAdminSession();','closeTripStudioPanel();'])if(!a.includes(token))fail.push('missing atomic Studio exit: '+token);
if(!a.includes('key!==previousFriend'))fail.push('different-traveller guard missing');
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('STUDIO IDENTITY CONTRACT: PASS');