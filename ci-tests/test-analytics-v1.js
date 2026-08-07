#!/usr/bin/env node
'use strict';
const fs=require('fs'),vm=require('vm');
function store(){const m=new Map();return {get:(k,f=null)=>m.has(k)?m.get(k):f,set:(k,v)=>{m.set(k,String(v));return true;},remove:k=>m.delete(k),readJSON:(k,f=null)=>{if(!m.has(k))return f;try{return JSON.parse(m.get(k));}catch{return f;}},writeJSON:(k,v)=>{m.set(k,JSON.stringify(v));return true;}};}
const local=store(),session=store(),sent=[];
const document={readyState:'complete',visibilityState:'visible',addEventListener(){},querySelector(){return null;}};
const ctx={console,Date,Math,JSON,URLSearchParams,CustomEvent:function(){},setTimeout,clearTimeout,setInterval:()=>0,
  document,location:{pathname:'/day.html',search:'?day=3'},navigator:{onLine:false},crypto:{randomUUID:(()=>{let n=0;return()=>`uuid-${++n}`;})()},
  TRIP_CONFIG:{storageNamespace:'nz-family-2026',participants:{defaultKey:'lee'}},SYNC_CONFIG:{tripId:'nz-family-2026',tables:{analytics:'trip_analytics_events'}},
  STORAGE_CONFIG:{keys:{friend:'nz_friend',analyticsQueue:'nz-family-2026:analytics_queue:v1',analyticsSession:'travel_engine_analytics_session_v1'}},
  STORAGE:{local,session},getFriend:()=>local.get('nz_friend','lee'),isAdminMode:()=>false,
  addEventListener(){},GenerationSelectionAdapter:{view:()=>({places:{foo:{cat:'DINING'}}})}
};
ctx.globalThis=ctx;ctx.window=ctx;local.set('nz_friend','fowlers');
vm.runInNewContext(fs.readFileSync(require('path').join(__dirname,'..','analytics-runtime.js'),'utf8'),ctx,{filename:'analytics-runtime.js'});
function assert(ok,msg){if(!ok){console.error('FAIL:',msg);process.exit(1);}}
(async()=>{
  await new Promise(r=>setTimeout(r,10));
  let q=ctx.ANALYTICS.readQueue();
  assert(q.some(e=>e.event_type==='page_view'&&e.entity_type==='day'&&e.entity_id==='3'),'Day page view queued');
  assert(q[0].traveller_id==='fowlers','Existing traveller identity used');
  const before=q.length;ctx.ANALYTICS.track('dup',{entityType:'test',entityId:'x'});ctx.ANALYTICS.track('dup',{entityType:'test',entityId:'x'});
  assert(ctx.ANALYTICS.readQueue().length===before+1,'Rapid duplicate suppressed');
  ctx.isAdminMode=()=>true;ctx.ANALYTICS.track('admin_probe',{entityType:'test',entityId:'admin'});
  assert(ctx.ANALYTICS.readQueue().some(e=>e.event_type==='admin_probe'&&e.actor_type==='admin'),'Admin events separated');
  ctx.navigator.onLine=true;ctx.SUPABASE={isConfigured:()=>true,getSession:async()=>({}),getClient:()=>({from:()=>({insert:async rows=>{sent.push(...(Array.isArray(rows)?rows:[rows]));return{error:null};},upsert:async()=>{throw new Error('analytics must not use upsert');}})})};
  await ctx.ANALYTICS.syncNow();assert(sent.length>0&&ctx.ANALYTICS.readQueue().length===0,'Reconnect flushes queue');
  ctx.SUPABASE={isConfigured:()=>true,getSession:async()=>({}),getClient:()=>({from:()=>({insert:async()=>({error:{message:'forced',code:'42501'}}),upsert:async()=>{throw new Error('analytics must not use upsert');}})})};
  ctx.ANALYTICS.track('failure_probe',{entityType:'test',entityId:'failure'});await ctx.ANALYTICS.syncNow();
  assert(ctx.ANALYTICS.readQueue().some(e=>e.event_type==='failure_probe'),'Write failure preserves queue');
  const runtimeSource=fs.readFileSync(require('path').join(__dirname,'..','analytics-runtime.js'),'utf8');
  assert(!runtimeSource.includes("track('expenses_open'"),'Expenses entry uses page_view only');
  assert(!runtimeSource.includes("track('moments_open'"),'Moments entry uses page_view only');
  console.log('ANALYTICS V1.2: PASS — page-entry normalization, insert-only sync, identity, queue, dedupe, admin separation, reconnect and write-failure isolation verified');
})().catch(e=>{console.error(e);process.exit(1);});
