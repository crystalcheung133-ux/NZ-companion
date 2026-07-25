/* Stage 3.2D Vietnam canonical local dual-write tests. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const vm=require('node:vm');
const Calculator=require('./expense-calculator.js');
const Provider=require('./canonical-expense-local-provider.js');
const Dual=require('./expense-dual-write.js');

const tests=[];
function test(name,fn){tests.push({name,fn});}
function config(){const c={};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync('trip-config.js','utf8'),c);return c.TRIP_CONFIG;}
const trip=config();
function memoryStorage(){
  const map=new Map();
  return {
    map,failWrite:false,
    get(key,fallback=null){return map.has(key)?map.get(key):fallback;},
    writeJSON(key,value){if(this.failWrite)return false;map.set(key,JSON.stringify(value));return true;},
    remove(key){map.delete(key);return true;}
  };
}
function harness(enabled=true){
  const storage=memoryStorage();
  const provider=Provider.createProvider({storage,key:'canonical-vn',enabled});
  let day=0;
  const dual=Dual.createDualWrite({
    enabled,project:'VN',tripId:trip.id,currency:'VND',parties:trip.parties,provider,
    now:()=>`2026-03-0${++day}T00:00:00Z`
  });
  return {storage,provider,dual};
}
function equal(item='Equal',createdAt='2026-01-01T00:00:00Z'){
  return {item,total:100,paidBy:'crystal',type:'shared',split:['christal','crystal','mero','vivian'],consumedBy:null,createdAt};
}

test('VN equal split by four writes persistent canonical id mapping',()=>{
  const legacy=equal();const {provider,dual}=harness();
  const result=dual.afterLegacyWrite({action:'create',legacyRecords:[legacy],targetIndex:0});
  const state=provider.read();
  assert.equal(result.success,true);assert.deepEqual(state.active[0].allocations.map(x=>x.amount),[25,25,25,25]);
  assert.match(state.active[0].expenseId,/^vn-expense-migration-/);
  assert.equal(state.idMappings[`VN:${legacy.createdAt}`],state.active[0].expenseId);
});
test('VN personal expense and settlement parity',()=>{
  const shared=equal();
  const personal={item:'Personal',total:80,paidBy:'mero',type:'personal',split:['vivian'],consumedBy:'vivian',createdAt:'2026-01-02T00:00:00Z'};
  const {provider,dual}=harness();
  dual.afterLegacyWrite({action:'create',legacyRecords:[shared],targetIndex:0});
  const result=dual.afterLegacyWrite({action:'create',legacyRecords:[shared,personal],targetIndex:1});
  const state=provider.read();
  assert.equal(result.success,true);assert.deepEqual(state.active[1].allocations,[{partyId:'party-vivian',amount:80}]);
  assert.deepEqual(Calculator.netSettlementPosition(state.active,trip.parties.order),{'party-christal':-25,'party-crystal':75,'party-mero':55,'party-vivian':-105});
});
test('VN edit keeps canonical id and createdAt while version progresses',()=>{
  const original=equal('Original');const edited={...original,item:'Edited',editedAt:'2026-01-05T00:00:00Z'};
  const {provider,dual}=harness();
  dual.afterLegacyWrite({action:'create',legacyRecords:[original],targetIndex:0});
  const id=provider.read().active[0].expenseId;
  const result=dual.afterLegacyWrite({action:'update',legacyRecords:[edited],targetIndex:0,previousRecord:original});
  const record=provider.read().active[0];
  assert.equal(result.success,true);assert.equal(record.expenseId,id);assert.equal(record.createdAt,original.createdAt);
  assert.equal(record.updatedAt,edited.editedAt);assert.equal(record.version,2);
});
test('VN repeated reads use persisted mapping rather than a new id',()=>{
  const record=equal();const {provider,dual}=harness();
  dual.afterLegacyWrite({action:'create',legacyRecords:[record],targetIndex:0});
  const first=provider.read();
  const edited={...record,item:'Updated',editedAt:'2026-01-06T00:00:00Z'};
  dual.afterLegacyWrite({action:'update',legacyRecords:[edited],targetIndex:0,previousRecord:record});
  const second=provider.read();
  assert.equal(first.idMappings[`VN:${record.createdAt}`],second.active[0].expenseId);
});
test('VN hard-delete legacy simulation creates local canonical tombstone only',()=>{
  const deleted=equal('Delete');const keep=equal('Keep','2026-01-02T00:00:00Z');
  const legacy=[deleted,keep];const {provider,dual}=harness();
  dual.afterLegacyWrite({action:'create',legacyRecords:[deleted],targetIndex:0});
  dual.afterLegacyWrite({action:'create',legacyRecords:legacy,targetIndex:1});
  legacy.splice(0,1);
  const result=dual.afterLegacyWrite({action:'delete',legacyRecords:legacy,targetIndex:0,previousRecord:deleted,deletedAt:'2026-03-03T00:00:00Z'});
  const state=provider.read();
  assert.equal(result.success,true);assert.equal(legacy.length,1);assert.equal(state.active.length,1);assert.equal(state.tombstones.length,1);
  assert.equal(state.tombstones[0].deletedAt,'2026-03-03T00:00:00Z');
});
test('VN missing category occurredAt and source version remain null with provenance diagnostics',()=>{
  const {provider,dual}=harness();const record=equal();
  const result=dual.afterLegacyWrite({action:'create',legacyRecords:[record],targetIndex:0});
  const canonical=provider.read().active[0];
  assert.equal(result.success,true);assert.equal(canonical.category,null);assert.equal(canonical.occurredAt,null);
  assert.equal(canonical.version,1);
  assert.deepEqual(canonical.migration.diagnostics.filter(x=>x.code==='SOURCE_FACT_MISSING').map(x=>x.field),['category','occurredAt','version']);
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
  const provider=Provider.createProvider({storage,key:'canonical-vn',enabled:true});
  const records=Array.from({length:12},(_,index)=>({
    expenseId:`quota-${index}`,tripId:trip.id,payerPartyId:'party-christal',
    amount:100,currency:'VND',
    description:'Browser quota regression record with repeated canonical field names',
    category:null,occurredAt:null,splitMode:'equal',
    allocations:trip.parties.order.map(partyId=>({partyId,amount:25})),
    createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z',
    deletedAt:null,version:1,migration:{source:'VN-legacy-expense',stage:'3.2D'}
  }));
  const result=provider.writeSnapshot({
    active:records,tombstones:[],
    idMappings:Object.fromEntries(records.map(record=>[`VN:${record.expenseId}`,record.expenseId])),
    status:{enabled:true,healthy:true}
  });
  assert.equal(result.ok,true);
  assert.equal(JSON.parse(map.get('canonical-vn')).storageEncoding,'canonical-expense-compact-v1');
  assert.equal(provider.read().active.length,12);
  assert.equal(provider.read().active[0].allocations[0].partyId,'party-christal');
});
test('dual-write disabled makes no canonical state',()=>{
  const {storage,dual}=harness(false);
  assert.equal(dual.afterLegacyWrite({action:'create',legacyRecords:[equal()],targetIndex:0}).attempted,false);
  assert.equal(storage.map.size,0);
});
test('canonical failure never reverses successful VN legacy array mutation',()=>{
  const legacy=[];legacy.push(equal());const {storage,dual}=harness();storage.failWrite=true;
  const result=dual.afterLegacyWrite({action:'create',legacyRecords:legacy,targetIndex:0});
  assert.equal(result.success,false);assert.equal(legacy.length,1);assert.equal(dual.getHealth().healthy,false);
});
test('duplicate VN stable source key generates id mapping failure and disables session',()=>{
  const record=equal();const duplicate={...equal('Duplicate')};const {dual}=harness();
  const result=dual.afterLegacyWrite({action:'create',legacyRecords:[record,duplicate],targetIndex:1});
  assert.equal(result.success,false);assert.equal(result.diagnostics[0].code,'ID_MAPPING_FAILURE');
});
test('VN modal/HTML remains byte-identical and runtime retains modal-stays-open ordering',()=>{
  const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
  assert.equal(hash('expenses.html'),'EA7DC0BCB57532F7D1C98A0A2FB2B3CABD83E57D9F02C59BD0BB42651F98FA88');
  const source=fs.readFileSync('expenses-runtime.js','utf8');
  assert(source.includes('Intentional: keep modal open for quick multiple expense entry.'));
  assert(source.indexOf('writeExpenses(arr);')<source.indexOf('window.CCMV_EXPENSE_DUAL_WRITE?.afterLegacyWrite'));
  assert.equal(source.includes('customShare_'),false);
});

let passed=0;
for(const entry of tests){
  try{entry.fn();passed++;process.stdout.write(`PASS VN 3.2D - ${entry.name}\n`);}
  catch(error){process.stderr.write(`FAIL VN 3.2D - ${entry.name}\n${error.stack}\n`);process.exitCode=1;}
}
if(!process.exitCode) process.stdout.write(`PASS VN Stage 3.2D: ${passed}/${tests.length}\n`);
