#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.resolve(__dirname,'..');
const ctx={console,globalThis:null};
ctx.globalThis=ctx;
ctx.LOCALE_CONFIG={currency:'AUD',timeZone:'Pacific/Auckland',language:'en'};
ctx.ASSET_CONFIG={branding:{splashLogo:'',secondaryMark:''},icons:{icon192:'',icon512:''},hero:{coverImage:''}};
ctx.THEME_CONFIG={name:'test'};
vm.createContext(ctx);
for(const file of ['trip-config.js','engine-integrity.js','data.js']){
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
}
if(!ctx.TRAVEL_ENGINE_ACCEPTANCE || !ctx.TRAVEL_ENGINE_ACCEPTANCE.valid){
  throw new Error('Runtime integrity acceptance did not complete successfully.');
}
console.log('RUNTIME INTEGRITY: PASS — data.js completes the production integrity gate.');
