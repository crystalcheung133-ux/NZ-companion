const fs=require('fs');
const data=fs.readFileSync('data.js','utf8');
const bad=[];
for(const token of ['WORTH IT · ★','M4.7 master integration','NZ Master Itinerary v3.0','WHY WE PICKED THIS ·','WHY WE CHOSE IT ·','Lee family transition stay.','Confirmed booking.']) if(data.includes(token)) bad.push(token);
if(bad.length){console.error('SHARED-FACING CONTENT: FAIL — '+bad.join(', '));process.exit(1);}
console.log('SHARED-FACING CONTENT: PASS');
