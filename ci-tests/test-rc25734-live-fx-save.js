const fs=require('fs'); const s=fs.readFileSync('expenses.js','utf8');
function ok(x,m){if(!x)throw new Error(m)}
ok(s.includes('getExpenseRateRecord(forceLive=false)'), 'force-live FX path missing');
ok(s.includes("getExpenseRateRecord(operation==='create')"), 'new expense does not force live FX');
ok(s.includes('MONEY.isCacheFresh(current)')&&s.includes('MONEY.isCacheFresh(cached)'), 'fresh-cache gate missing');
ok(s.includes('MONEY.fetchLatestRate()'), 'live FX fetch missing');
console.log('RC25.7.34 LIVE FX SAVE CONTRACT: PASS');
