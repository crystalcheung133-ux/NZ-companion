/* Stage 3.2D Canonical Core, local provider and controlled dual-write tests. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const vm=require('node:vm');
const Calculator=require('./expense-calculator.js');
const Core=require('./canonical-expense-core.js');
const Provider=require('./canonical-expense-local-provider.js');
const Dual=require('./expense-dual-write.js');

const tests=[];
function test(name,fn){tests.push({name,fn});}
function config(){
  const context={
    LOCALE_CONFIG:{currency:{code:'NZD'},timeZone:'Pacific/Auckland',language:'en-NZ'},
    ASSET_CONFIG:{branding:{splashLogo:'',secondaryMark:''},icons:{icon192:'',icon512:''},hero:{coverImage:''}},
    THEME_CONFIG:{name:'test',colors:{}}
  };
  context.globalThis=context;vm.createContext(context);
  vm.runInContext(fs.readFileSync('trip-config.js','utf8'),context);
  return context.TRIP_CONFIG;
}
const trip=config();
const coreOptions=(now='2026-01-01T00:00:00Z',writable=true)=>({
  tripId:'nz-family-2026',currency:'NZD',parties:trip.parties,lifecycleWritable:writable,now
});
const base={
  expenseId:'nz-1',tripId:'nz-family-2026',payerPartyId:'party-lee',
  amount:100,currency:'NZD',description:'Dinner',category:'Meals',occurredAt:null,
  splitMode:'equal',allocations:[
    {partyId:'party-lee',amount:100/3},
    {partyId:'party-fowlers',amount:100/3},
    {partyId:'party-yau',amount:100/3}
  ],
  createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z',
  deletedAt:null,version:null,migration:{source:'test'}
};
function memoryStorage(){
  const map=new Map();
  return {
    map,failWrite:false,corruptRead:false,
    get(key,fallback=null){if(this.corruptRead)return '{bad';return map.has(key)?map.get(key):fallback;},
    writeJSON(key,value){if(this.failWrite)return false;map.set(key,JSON.stringify(value));return true;},
    remove(key){map.delete(key);return true;}
  };
}
function harness(enabled=true,clock){
  const storage=memoryStorage();
  const provider=Provider.createProvider({storage,key:'canonical-state',enabled});
  let tick=0;
  const dual=Dual.createDualWrite({
    enabled,project:'NZ',tripId:'nz-family-2026',currency:'NZD',
    parties:trip.parties,provider,now:clock||(()=>`2026-02-0${++tick}T00:00:00Z`)
  });
  return {storage,provider,dual};
}
function equal(id='legacy-1',total=100){
  return {id,item:'Equal',details:'Equal',category:'Meals',total,paidBy:'lee',type:'shared',split:['lee','fowlers','yau'],splitMode:'equal',shares:null,consumedBy:null,createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z'};
}

test('canonical create',()=>{
  const record=Core.create(base,coreOptions());
  assert.equal(record.expenseId,'nz-1');assert.equal(record.version,1);
  assert.equal(Object.isFrozen(record),true);
});
test('canonical edit preserves createdAt and progresses updatedAt/version',()=>{
  const created=Core.create(base,coreOptions());
  const updated=Core.update(created,{...base,description:'Edited',updatedAt:'2026-01-02T00:00:00Z'},coreOptions('2026-01-02T00:00:00Z'));
  assert.equal(updated.createdAt,created.createdAt);assert.equal(updated.updatedAt,'2026-01-02T00:00:00Z');
  assert.equal(updated.version,2);assert.equal(updated.expenseId,created.expenseId);
});
test('canonical delete creates full tombstone',()=>{
  const created=Core.create(base,coreOptions());
  const tomb=Core.delete(created,coreOptions('2026-01-03T00:00:00Z'));
  assert.equal(tomb.deletedAt,'2026-01-03T00:00:00Z');assert.equal(tomb.updatedAt,tomb.deletedAt);
  assert.equal(tomb.version,2);assert.equal(tomb.createdAt,created.createdAt);assert.equal(tomb.allocations.length,3);
});
test('Party, allocation, splitMode and trip/currency validation',()=>{
  assert.throws(()=>Core.create({...base,payerPartyId:'party-unknown'},coreOptions()),/Unknown payer Party/);
  assert.throws(()=>Core.create({...base,allocations:[{partyId:'party-lee',amount:1}]},coreOptions()),/do not balance/);
  assert.throws(()=>Core.create({...base,splitMode:'mystery'},coreOptions()),/Unsupported splitMode/);
  assert.throws(()=>Core.create({...base,tripId:'wrong'},coreOptions()),/Trip mismatch/);
  assert.throws(()=>Core.create({...base,currency:'USD'},coreOptions()),/Currency mismatch/);
});
test('lifecycle writability input rejects command without owning lifecycle',()=>{
  assert.throws(()=>Core.create(base,coreOptions(undefined,false)),error=>error.code==='LIFECYCLE_NOT_WRITABLE');
});
test('canonical local storage round-trip and clear hook',()=>{
  const {provider}=harness();
  const created=Core.create(base,coreOptions());
  assert.equal(provider.writeSnapshot({active:[created],tombstones:[],idMappings:{'NZ:nz-1':'nz-1'},status:{enabled:true,healthy:true}}).ok,true);
  assert.equal(provider.read().active[0].expenseId,'nz-1');assert.equal(Object.isFrozen(provider.read()),true);
  assert.equal(provider.clearAll(),true);assert.equal(provider.read().active.length,0);
});
test('browser quota fallback stores and reads a compact canonical snapshot',()=>{
  const map=new Map();
  const storage={
    get(key,fallback=null){return map.has(key)?map.get(key):fallback;},
    writeJSON(key,value){
      const serialized=JSON.stringify(value);
      if(serialized.length>7000)return false;
      map.set(key,serialized);return true;
    },
    remove(key){map.delete(key);return true;}
  };
  const provider=Provider.createProvider({storage,key:'canonical-state',enabled:true});
  const records=Array.from({length:12},(_,index)=>Core.create({
    ...base,expenseId:`quota-${index}`,
    description:'Browser quota regression record with repeated canonical field names'
  },coreOptions()));
  const result=provider.writeSnapshot({
    active:records,tombstones:[],
    idMappings:Object.fromEntries(records.map(record=>[`NZ:${record.expenseId}`,record.expenseId])),
    status:{enabled:true,healthy:true}
  });
  assert.equal(result.ok,true);
  assert.equal(JSON.parse(map.get('canonical-state')).storageEncoding,'canonical-expense-compact-v1');
  assert.equal(provider.read().active.length,12);
  assert.equal(provider.read().active[0].allocations[0].partyId,'party-lee');
});
test('corrupted canonical storage disables provider without overwriting corruption',()=>{
  const {storage,provider}=harness();storage.map.set('canonical-state','{bad');
  const state=provider.read();
  assert.equal(state.status.healthy,false);assert.equal(state.diagnostics[0].code,'STORAGE_CORRUPTION');
  assert.equal(storage.map.get('canonical-state'),'{bad');
});
test('dual-write disabled performs no canonical write',()=>{
  const {storage,dual}=harness(false);
  const result=dual.afterLegacyWrite({action:'create',legacyRecords:[equal()],targetIndex:0});
  assert.equal(result.attempted,false);assert.equal(storage.map.size,0);
});
test('NZ create equal split and stable id mapping',()=>{
  const {provider,dual}=harness();
  const result=dual.afterLegacyWrite({action:'create',legacyRecords:[equal()],targetIndex:0});
  assert.equal(result.success,true);const state=provider.read();
  assert.equal(state.active[0].expenseId,'legacy-1');assert.equal(state.active[0].version,1);
  assert.deepEqual(state.active[0].allocations.map(x=>x.amount),[100/3,100/3,100/3]);
  assert.equal(state.idMappings['NZ:legacy-1'],'legacy-1');
});
test('NZ non-divisible equal split remains unrounded',()=>{
  const {provider,dual}=harness();dual.afterLegacyWrite({action:'create',legacyRecords:[equal('raw',101)],targetIndex:0});
  assert.equal(provider.read().active[0].allocations[0].amount,101/3);
});
test('NZ custom split, automatic remainder and personal expense',()=>{
  const custom={...equal('custom',100),splitMode:'custom',shares:{lee:20,fowlers:30,yau:50}};
  const personal={...equal('personal',40),paidBy:'yau',type:'personal',split:['lee'],splitMode:'personal',shares:null,consumedBy:'lee'};
  const {provider,dual}=harness();
  assert.equal(Calculator.automaticRemainder(100,[20,30]),50);
  dual.afterLegacyWrite({action:'create',legacyRecords:[custom],targetIndex:0});
  dual.afterLegacyWrite({action:'create',legacyRecords:[custom,personal],targetIndex:1});
  const state=provider.read();
  assert.deepEqual(state.active[0].allocations.map(x=>x.amount),[20,30,50]);
  assert.deepEqual(state.active[1].allocations,[{partyId:'party-lee',amount:40}]);
});
test('NZ custom edit keeps id/createdAt and increments version',()=>{
  const original={...equal('custom-edit',100),splitMode:'custom',shares:{lee:20,fowlers:30,yau:50}};
  const edited={...original,shares:{lee:25,fowlers:25,yau:50},updatedAt:'2026-01-02T00:00:00Z',editedAt:'2026-01-02T00:00:00Z'};
  const {provider,dual}=harness();
  dual.afterLegacyWrite({action:'create',legacyRecords:[original],targetIndex:0});
  const result=dual.afterLegacyWrite({action:'update',legacyRecords:[edited],targetIndex:0,previousRecord:original});
  const record=provider.read().active[0];
  assert.equal(result.success,true);assert.equal(record.expenseId,'custom-edit');assert.equal(record.createdAt,original.createdAt);
  assert.equal(record.updatedAt,edited.updatedAt);assert.equal(record.version,2);
});
test('NZ delete creates canonical tombstone and settlement remains equivalent',()=>{
  const first=equal('delete-me',90);const second={...equal('keep',30),paidBy:'fowlers',type:'personal',split:['yau'],splitMode:'personal',consumedBy:'yau'};
  const {provider,dual}=harness();
  dual.afterLegacyWrite({action:'create',legacyRecords:[first],targetIndex:0});
  dual.afterLegacyWrite({action:'create',legacyRecords:[first,second],targetIndex:1});
  const result=dual.afterLegacyWrite({action:'delete',legacyRecords:[second],targetIndex:0,previousRecord:first,deletedAt:'2026-02-03T00:00:00Z'});
  const state=provider.read();
  assert.equal(result.success,true);assert.equal(state.active.length,1);assert.equal(state.tombstones.length,1);
  assert.equal(state.tombstones[0].expenseId,'delete-me');assert.equal(state.tombstones[0].version,2);
  assert.equal(state.lastValidation.status,'passed');
});
test('forced canonical failure leaves simulated legacy write successful and disables later attempts',()=>{
  const legacy=[];legacy.push(equal('legacy-survives'));
  const {storage,dual}=harness();storage.failWrite=true;
  const failed=dual.afterLegacyWrite({action:'create',legacyRecords:legacy,targetIndex:0});
  assert.equal(failed.success,false);assert.equal(legacy.length,1);
  storage.failWrite=false;
  const skipped=dual.afterLegacyWrite({action:'create',legacyRecords:legacy,targetIndex:0});
  assert.equal(skipped.attempted,false);assert.equal(dual.getHealth().healthy,false);
});
test('Supabase, Export Centre and HTML remain byte-identical to Stage 3.2C',()=>{
  const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
  assert.equal(hash('expense-sync-runtime.js'),'FBBFD497B74F4220F0E77853273D4743B9AFAEBF05CB8888F6C2CEC61DB026CA');
  assert.equal(hash('export-runtime.js'),'1B7DADDF742724D9BA92803401938318EA7DA7FA08709ABEBB7F89A2F38159DE');
  assert.equal(hash('expenses.html'),'3C94B1FC3BD5C3CE87E4527837B2D6442F66D897A269261ADE04EF4F4191DB6C');
  const source=fs.readFileSync('expenses.js','utf8');
  assert.equal(source.indexOf('writeExpenses(arr);')<source.indexOf('window.CCMV_EXPENSE_DUAL_WRITE?.afterLegacyWrite'),true);
});

let passed=0;
for(const entry of tests){
  try{entry.fn();passed++;process.stdout.write(`PASS NZ 3.2D - ${entry.name}\n`);}
  catch(error){process.stderr.write(`FAIL NZ 3.2D - ${entry.name}\n${error.stack}\n`);process.exitCode=1;}
}
if(!process.exitCode) process.stdout.write(`PASS NZ Stage 3.2D: ${passed}/${tests.length}\n`);
