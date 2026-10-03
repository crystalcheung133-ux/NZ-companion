const fs=require('fs'),assert=require('assert');
const src=fs.readFileSync('moments.js','utf8');
assert(src.includes('const momentSavePendingSessions = new Set()'),'session-scoped pending set missing');
assert(src.includes('momentSavePendingSessions.has(momentEditorSession)'),'current session lock missing');
assert(src.includes('momentSavePendingSessions.add(sessionAtStart)'),'save session not locked');
assert(src.includes('momentSavePendingSessions.delete(sessionAtStart)'),'save session not released');
assert(src.includes('if(sessionAtStart===momentEditorSession && save)'),'stale finally can touch newer editor');
assert((src.match(/save\.disabled=false;save\.removeAttribute\('aria-busy'\)/g)||[]).length>=3,'new/reset/edit editor must explicitly initialise enabled state');
console.log('CF4 SAVE SESSION LOCK CONTRACT: PASS');
