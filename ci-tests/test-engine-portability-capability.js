const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const runtimeFiles=['analytics-runtime.js','sync-config.js','storage-config.js','publication-runtime.js','core-runtime.js','expenses.js','moments.js','moments-compat.js','expense-sync-runtime.js','moment-sync-runtime.js','export-runtime.js','complete-runtime.js'];
const forbidden=[
 ['NZ trip id',/nz-family-2026/],['legacy NZ identity key',/nz_friend/],['Lee literal fallback',/\|\|\s*['"]lee['"]/],
 ['fixed NZ party order',/\[['"]lee['"],['"]fowlers['"],['"]yau['"]\]/],['New Zealand export filename',/New-Zealand-Expenses/]
];
for(const file of runtimeFiles){
 const text=fs.readFileSync(path.join(root,file),'utf8');
 for(const [label,re] of forbidden) assert(!re.test(text),`${file}: ${label}`);
}
const schema=fs.readFileSync(path.join(root,'ANALYTICS-SCHEMA.sql'),'utf8');
assert(!/nz-family-2026/.test(schema),'Analytics schema must not hard-code NZ trip');
assert(/grant insert on public\.trip_analytics_events to authenticated/i.test(schema),'Analytics INSERT grant missing');
assert(/revoke select, update, delete on public\.trip_analytics_events from authenticated/i.test(schema),'Analytics INSERT-only restriction missing');
console.log('ENGINE PORTABILITY CAPABILITY: PASS');
