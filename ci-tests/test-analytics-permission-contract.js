#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const runtime=fs.readFileSync(path.join(__dirname,'..','analytics-runtime.js'),'utf8');
const sql=fs.readFileSync(path.join(__dirname,'..','ANALYTICS-SCHEMA.sql'),'utf8');
function assert(ok,msg){if(!ok){console.error('FAIL:',msg);process.exit(1);}}
assert(/\.insert\(batch\)/.test(runtime),'analytics bulk sync uses INSERT');
assert(!/\.upsert\(/.test(runtime),'analytics runtime does not use UPSERT');
assert(/grant\s+insert\s+on\s+public\.trip_analytics_events\s+to\s+authenticated/i.test(sql),'schema grants authenticated INSERT');
assert(/revoke\s+select,\s*update,\s*delete\s+on\s+public\.trip_analytics_events\s+from\s+authenticated/i.test(sql),'schema keeps traveller read/update/delete revoked');
console.log('ANALYTICS PERMISSION CONTRACT: PASS — runtime write method matches INSERT-only Supabase grants');
