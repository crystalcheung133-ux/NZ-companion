/* Stage 3.2B source-derived characterization and foundation validation. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const Calculator=require('./expense-calculator.js');
const Adapter=require('./legacy-expense-adapter.js');

const tests=[];
function test(name,fn){tests.push({name,fn});}
function loadTripConfig(){
  const context={
    LOCALE_CONFIG:{currency:{code:'NZD'},timeZone:'Pacific/Auckland',language:'en-NZ'},
    ASSET_CONFIG:{branding:{splashLogo:'',secondaryMark:''},icons:{icon192:'',icon512:''},hero:{coverImage:''}},
    THEME_CONFIG:{name:'test',colors:{}}
  };
  context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('trip-config.js','utf8'),context);
  return context.TRIP_CONFIG;
}
const config=loadTripConfig();
const options={project:'NZ',tripId:'nz-family-2026',currency:'NZD',parties:config.parties};
const adapt=(record,index=0)=>Adapter.adapt(record,index,options);

test('Party directory aliases, order, colours and Lee permission',()=>{
  assert.deepEqual(Array.from(config.parties.order),['party-lee','party-fowlers','party-yau']);
  assert.equal(config.parties.identities['party-lee'].legacyAliases[0],'lee');
  assert.equal(config.parties.identities['party-fowlers'].colour,'#2f6fa3');
  assert.equal(config.parties.identities['party-lee'].permissions.adminEligible,true);
});
test('equal split',()=>{
  assert.deepEqual(adapt({id:'eq',total:90,paidBy:'lee',type:'shared',split:['lee','fowlers','yau'],splitMode:'equal'}).allocations.map(x=>x.amount),[30,30,30]);
});
test('non-divisible equal split preserves raw arithmetic',()=>{
  const values=adapt({id:'eq-raw',total:100,paidBy:'lee',type:'shared',split:['lee','fowlers','yau'],splitMode:'equal'}).allocations.map(x=>x.amount);
  assert.equal(values[0],100/3);assert.equal(Calculator.sumAmounts(values),100);
});
test('custom split',()=>{
  const expense=adapt({id:'custom',total:100,paidBy:'fowlers',type:'shared',split:['lee','fowlers','yau'],splitMode:'custom',shares:{lee:20,fowlers:30,yau:50}});
  assert.deepEqual(expense.allocations.map(x=>x.amount),[20,30,50]);
  assert.equal(Calculator.validateCustomAllocations(100,expense.allocations).valid,true);
});
test('automatic remainder',()=>assert.equal(Calculator.automaticRemainder(100,[20,30]),50));
test('manual remainder',()=>{
  const result=Calculator.validateCustomAllocations(100,[{partyId:'party-lee',amount:20},{partyId:'party-fowlers',amount:30},{partyId:'party-yau',amount:50}]);
  assert.equal(result.valid,true);assert.equal(result.difference,0);
});
test('personal expense',()=>{
  const expense=adapt({id:'personal',total:70,paidBy:'lee',type:'personal',consumedBy:'yau',split:['yau'],splitMode:'personal'});
  assert.deepEqual(expense.allocations,[{partyId:'party-yau',amount:70}]);
});
test('payer and consumer combinations',()=>{
  const same=adapt({id:'same',total:20,paidBy:'lee',type:'personal',consumedBy:'lee'});
  const other=adapt({id:'other',total:20,paidBy:'lee',type:'personal',consumedBy:'fowlers'});
  assert.deepEqual(Calculator.netSettlementPosition([same],config.parties.order),{'party-lee':0,'party-fowlers':0,'party-yau':0});
  assert.deepEqual(Calculator.netSettlementPosition([other],config.parties.order),{'party-lee':20,'party-fowlers':-20,'party-yau':0});
});
test('settlement remains raw and balanced',()=>{
  const expenses=[
    adapt({id:'a',total:100,paidBy:'lee',type:'shared',split:['lee','fowlers','yau'],splitMode:'equal'}),
    adapt({id:'b',total:30,paidBy:'fowlers',type:'personal',consumedBy:'yau'})
  ];
  const positions=Calculator.netSettlementPosition(expenses,config.parties.order);
  assert.equal(positions['party-lee'],100-100/3);
  assert.equal(positions['party-fowlers'],30-100/3);
  assert.equal(positions['party-yau'],-100/3-30);
  assert.equal(Calculator.validateBalance(positions).valid,true);
});
test('deleted expense exclusion',()=>{
  const live=adapt({id:'live',total:30,paidBy:'lee',type:'personal',consumedBy:'yau'});
  const deleted=adapt({id:'gone',total:90,paidBy:'fowlers',type:'personal',consumedBy:'lee',deletedAt:'2026-01-02T00:00:00Z'});
  assert.deepEqual(Calculator.netSettlementPosition([live,deleted],config.parties.order),{'party-lee':30,'party-fowlers':0,'party-yau':-30});
});
test('legacy equal fallback',()=>{
  const expense=adapt({id:'legacy',total:60,paidBy:'lee',type:'shared',split:['lee','yau']});
  assert.equal(expense.splitMode,'equal');
  assert(expense.migration.diagnostics.some(x=>x.code==='LEGACY_EQUAL_FALLBACK'));
});
test('amount tolerance',()=>{
  assert.equal(Calculator.amountsMatch(100,99.995),true);
  /* Source parity: binary floating point makes 100 - 99.99 slightly > .01. */
  assert.equal(Calculator.amountsMatch(100,99.99),false);
  assert.equal(Calculator.amountsMatch(100,99.989),false);
});
test('existing NZ id and timestamps are preserved',()=>{
  const expense=adapt({id:'source-id',total:10,paidBy:'lee',type:'shared',split:['lee'],createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-02T00:00:00Z'});
  assert.equal(expense.expenseId,'source-id');assert.equal(expense.createdAt,'2026-01-01T00:00:00Z');assert.equal(expense.updatedAt,'2026-01-02T00:00:00Z');
});
test('canonical references use partyId only',()=>{
  const expense=adapt({id:'refs',total:10,paidBy:'lee',type:'shared',split:['lee','yau']});
  assert.match(expense.payerPartyId,/^party-/);
  expense.allocations.forEach(row=>assert.match(row.partyId,/^party-/));
  assert.equal(JSON.stringify(expense).includes('"participant'),false);
});
test('adapter is read-only and production paths do not load foundation modules',()=>{
  const source={id:'immutable',total:10,paidBy:'lee',type:'shared',split:['lee']};
  const before=JSON.stringify(source);adapt(source);assert.equal(JSON.stringify(source),before);
  const html=fs.readFileSync('expenses.html','utf8');
  assert.equal(html.includes('expense-calculator.js'),false);
  assert.equal(html.includes('legacy-expense-adapter.js'),false);
});

let passed=0;
for(const entry of tests){
  try{entry.fn();passed++;process.stdout.write(`PASS NZ - ${entry.name}\n`);}
  catch(error){process.stderr.write(`FAIL NZ - ${entry.name}\n${error.stack}\n`);process.exitCode=1;}
}
if(!process.exitCode) process.stdout.write(`PASS NZ Stage 3.2B: ${passed}/${tests.length}\n`);
