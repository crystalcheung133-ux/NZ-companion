const fs=require('fs');
const day=fs.readFileSync('day.html','utf8');
const expenses=fs.readFileSync('expenses.js','utf8');
const checks=[
 ['primary Guide button exists',day.includes('primaryGuideHtml')&&day.includes("JSON.stringify([primaryGuideId])")],
 ['alternative IDs exclude primary',day.includes("guideIds.filter(key=>key!==primaryGuideId)")],
 ['alternative button opens alternatives only',day.includes('JSON.stringify(alternativeGuideIds)')],
 ['visual viewport bounds are used',expenses.includes('expenseVisibleBounds')&&expenses.includes('visualViewport')],
 ['nested expense modal scroller is adjusted',expenses.includes("closest('#expenseModal .tools-sheet')")&&expenses.includes('sheet.scrollTop+=delta')],
 ['keyboard animation is repeatedly checked',expenses.includes('setInterval')&&expenses.includes('1300')]
];
let pass=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} Stage 3.2G — ${name}`);if(ok)pass++;}
if(pass!==checks.length) process.exit(1);
console.log(`PASS Stage 3.2G UI regression: ${pass}/${checks.length}`);
