/* Stage 3.2C canonical repository and dual-read validation tests. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const Calculator=require('./expense-calculator.js');
const Repository=require('./canonical-expense-repository.js');

const tests=[];
function test(name,fn){tests.push({name,fn});}
function loadConfig(){
  const context={
    LOCALE_CONFIG:{currency:{code:'NZD'},timeZone:'Pacific/Auckland',language:'en-NZ'},
    ASSET_CONFIG:{branding:{splashLogo:'',secondaryMark:''},icons:{icon192:'',icon512:''},hero:{coverImage:''}},
    THEME_CONFIG:{name:'test',colors:{}}
  };
  context.globalThis=context;vm.createContext(context);
  vm.runInContext(fs.readFileSync('trip-config.js','utf8'),context);
  return context.TRIP_CONFIG;
}
const config=loadConfig();
const options={project:'NZ',tripId:'nz-family-2026',currency:'NZD',parties:config.parties};
const makeRepository=()=>Repository.createRepository(options);
const fixture=[
  {id:'equal',item:'Equal',details:'Equal',category:'Meals',total:100,paidBy:'lee',type:'shared',split:['lee','fowlers','yau'],splitMode:'equal',createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z',version:1},
  {id:'custom',item:'Custom',details:'Custom',category:'Other',total:90,paidBy:'fowlers',type:'shared',split:['lee','fowlers','yau'],splitMode:'custom',shares:{lee:10,fowlers:30,yau:50},createdAt:'2026-01-02T00:00:00Z',updatedAt:'2026-01-02T00:00:00Z',version:1},
  {id:'personal',item:'Personal',details:'Personal',category:'Other',total:40,paidBy:'yau',type:'personal',split:['lee'],splitMode:'personal',consumedBy:'lee',createdAt:'2026-01-03T00:00:00Z',updatedAt:'2026-01-03T00:00:00Z',version:1},
  {id:'deleted',item:'Deleted',details:'Deleted',category:'Other',total:70,paidBy:'lee',type:'personal',split:['fowlers'],splitMode:'personal',consumedBy:'fowlers',createdAt:'2026-01-04T00:00:00Z',updatedAt:'2026-01-05T00:00:00Z',deletedAt:'2026-01-05T00:00:00Z',version:1}
];

test('dual-read canonical projection is equivalent',()=>{
  const result=makeRepository().loadForValidation(fixture);
  assert.equal(result.comparison.equivalent,true);
  assert.equal(result.records.length,4);
  assert.equal(result.diagnostics.length,0);
});
test('equal split preserves raw thirds',()=>{
  const expense=makeRepository().loadForValidation([fixture[0]]).records[0];
  assert.deepEqual(expense.allocations.map(x=>x.amount),[100/3,100/3,100/3]);
});
test('custom split and allocation validation',()=>{
  const expense=makeRepository().loadForValidation([fixture[1]]).records[0];
  assert.deepEqual(expense.allocations.map(x=>x.amount),[10,30,50]);
  assert.equal(Calculator.validateCustomAllocations(expense.amount,expense.allocations).valid,true);
});
test('personal expense and Party ownership',()=>{
  const expense=makeRepository().loadForValidation([fixture[2]]).records[0];
  assert.equal(expense.payerPartyId,'party-yau');
  assert.deepEqual(expense.allocations,[{partyId:'party-lee',amount:40}]);
});
test('deleted expense is retained canonically and excluded from settlement',()=>{
  const result=makeRepository().loadForValidation(fixture);
  assert.equal(result.records[3].deletedAt,'2026-01-05T00:00:00Z');
  const withoutDeleted=Calculator.netSettlementPosition(result.records.slice(0,3),config.parties.order);
  const withDeleted=Calculator.netSettlementPosition(result.records,config.parties.order);
  assert.deepEqual(withDeleted,withoutDeleted);
});
test('settlement validation compares legacy and canonical results',()=>{
  const result=makeRepository().loadForValidation(fixture);
  assert.equal(result.diagnostics.some(x=>x.code==='SETTLEMENT_MISMATCH'),false);
  assert.equal(Calculator.validateBalance(Calculator.netSettlementPosition(result.records,config.parties.order)).valid,true);
});
test('Party aliases resolve through repository directory',()=>{
  assert.equal(Repository.resolveParty('lee',config.parties),'party-lee');
  assert.equal(Repository.resolveParty('party-fowlers',config.parties),'party-fowlers');
  assert.equal(Repository.resolveParty('unknown',config.parties),null);
});
test('allocation normalization returns canonical immutable rows',()=>{
  const rows=Repository.normalizeAllocations([{partyId:'party-lee',amount:'NZD 12.50'}]);
  assert.deepEqual(rows,[{partyId:'party-lee',amount:12.5}]);
  assert.equal(Object.isFrozen(rows[0]),true);
});
test('canonical records contain only frozen Stage 3 fields',()=>{
  const result=makeRepository().loadForValidation([fixture[0]]);
  assert.deepEqual(Object.keys(result.records[0]),Array.from(Repository.CANONICAL_FIELDS));
  assert.equal(Object.isFrozen(result.records[0]),true);
  assert.equal(Object.isFrozen(result.records[0].allocations),true);
});
test('repository retrieval is immutable and input remains unchanged',()=>{
  const input=JSON.parse(JSON.stringify(fixture));
  const before=JSON.stringify(input);
  const repository=makeRepository();repository.loadForValidation(input);
  assert.equal(JSON.stringify(input),before);
  assert.equal(repository.getById('custom').expenseId,'custom');
  assert.equal(Object.isFrozen(repository.getAll()),true);
});
test('all Stage 3.2C mismatch diagnostics are generated by controlled faults',()=>{
  const canonical=makeRepository().loadForValidation([fixture[0]]).records[0];
  const partyFault={...canonical,payerPartyId:'party-yau'};
  assert(Repository.compareProjection(fixture[0],partyFault,0,options).some(x=>x.code==='PARTY_MISMATCH'));
  const allocationFault={...canonical,allocations:[{partyId:'party-lee',amount:100}]};
  assert(Repository.compareProjection(fixture[0],allocationFault,0,options).some(x=>x.code==='ALLOCATION_MISMATCH'));
  const repositoryFault={...canonical,description:'Changed'};
  assert(Repository.compareProjection(fixture[0],repositoryFault,0,options).some(x=>x.code==='REPOSITORY_MISMATCH'));
  const settlementFault={...canonical,amount:101};
  assert(Repository.compareSettlement([fixture[0]],[settlementFault],options).some(x=>x.code==='SETTLEMENT_MISMATCH'));
  assert(Repository.validateCanonical({...canonical,tripId:'wrong'},0,options).some(x=>x.code==='VALIDATION_FAILURE'));
  assert(Repository.compareProjection({...fixture[0],futureField:'unsupported'},canonical,0,options).some(x=>x.code==='UNSUPPORTED_LEGACY_FIELD'));
});
test('production paths do not load repository',()=>{
  for(const file of ['expenses.html','index.html']){
    assert.equal(fs.readFileSync(file,'utf8').includes('canonical-expense-repository.js'),false);
  }
  assert.equal(fs.readFileSync('canonical-expense-repository.js','utf8').includes('Supabase'),true);
  assert.equal(/localStorage|writeJSON|querySelector|fetch\(/.test(fs.readFileSync('canonical-expense-repository.js','utf8')),false);
});

let passed=0;
for(const entry of tests){
  try{entry.fn();passed++;process.stdout.write(`PASS NZ REPOSITORY - ${entry.name}\n`);}
  catch(error){process.stderr.write(`FAIL NZ REPOSITORY - ${entry.name}\n${error.stack}\n`);process.exitCode=1;}
}
if(!process.exitCode) process.stdout.write(`PASS NZ Stage 3.2C Repository: ${passed}/${tests.length}\n`);
