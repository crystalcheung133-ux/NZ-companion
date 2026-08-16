#!/usr/bin/env node
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..');
let source=fs.readFileSync(path.join(root,'data.js'),'utf8');
source+='\nthis.__ITINERARY_DATA = ITINERARY_DATA;';
const ctx={}; vm.createContext(ctx); vm.runInContext(source,ctx);
const days=ctx.__ITINERARY_DATA||{};
function minutes(label){if(!label)return null;const m=String(label).match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);if(!m)return null;let h=Number(m[1]);const min=Number(m[2]);const ap=m[3]&&m[3].toUpperCase();if(ap==='PM'&&h!==12)h+=12;if(ap==='AM'&&h===12)h=0;return h*60+min;}
const failures=[],seen=new Set();
for(const [dayNo,day] of Object.entries(days)){
  if(!day||!Array.isArray(day.items)){failures.push(`Day ${dayNo}: missing items array`);continue;}
  let last=null;
  for(const item of day.items){
    if(!item||!item.id){failures.push(`Day ${dayNo}: timeline item missing id`);continue;}
    if(seen.has(item.id))failures.push(`Duplicate timeline item id: ${item.id}`); seen.add(item.id);
    const current=minutes(item.time); if(current===null)continue;
    if(last!==null&&current<last)failures.push(`Day ${dayNo}: ${item.time} (${item.title}) occurs before previous explicit time.`); last=current;
  }
}
if(!Object.keys(days).length)failures.push('No itinerary days found.');
if(failures.length){console.error('TIMELINE INTEGRITY: FAILED');failures.forEach(f=>console.error(`- ${f}`));process.exit(1);}
console.log(`TIMELINE INTEGRITY: PASS — ${Object.keys(days).length} days; explicit times monotonic; timeline IDs unique.`);
