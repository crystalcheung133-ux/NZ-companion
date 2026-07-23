/* Dependency-free staged tests for Travel Engine Integrity E1–E5. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const Engine=require('./engine-integrity.js');

const tests=[];
function test(stage,name,fn){tests.push({stage,name,fn});}
function clone(value){return JSON.parse(JSON.stringify(value));}
function config(){return {tripName:'Test Trip',startDate:'2030-01-01',endDate:'2030-01-02',version:'RCX'};}
function cleanData(){
  return {
    PLACES:{p1:{id:'p1',title:'Place One'}},
    CATEGORIES:{SIGHTS:[{key:'p1'}]},
    GUIDE_ORDER:['p1'],
    DAY_LINKS:{p1:[1]},
    ITINERARY_DATA:{1:{items:[{id:'item-1',placeId:'p1',title:'Visit Place One'}]}},
    BOOKINGS_DATA:{b1:{id:'b1',type:'accommodation',title:'Hotel',placeId:'p1',checkIn:'14:00',checkOut:'10:00',stayDates:'1–2 Jan'}},
    NAVIGATION_ACTIONS:[]
  };
}
function has(result,code){return result.errors.some(item=>item.code===code)||result.warnings.some(item=>item.code===code);}

test('E1','duplicate place ID',()=>{
  const data=cleanData();data.PLACES=[{id:'p1'},{id:'p1'}];
  assert(has(Engine.validateE1(data,config()),'ENTITY_PLACE_ID_DUPLICATE'));
});
test('E1','duplicate itinerary ID',()=>{
  const data=cleanData();data.ITINERARY_DATA[1].items.push({id:'item-1',placeId:'p1'});
  assert(has(Engine.validateE1(data,config()),'ENTITY_ITINERARYITEM_ID_DUPLICATE'));
});
test('E1','malformed ID',()=>{
  const data=cleanData();data.PLACES={' bad id ':{title:'Bad'}};
  assert(has(Engine.validateE1(data,config()),'ENTITY_ID_MALFORMED'));
});
test('E1','unresolved canonical entity',()=>{
  const data=cleanData();data.CANONICAL_REFERENCES=[{entityType:'place',entityId:'missing',field:'placeId'}];
  assert(has(Engine.validateE1(data,config()),'ENTITY_CANONICAL_REFERENCE_UNRESOLVED'));
});
test('E1','clean dataset pass',()=>assert.equal(Engine.validateE1(cleanData(),config()).valid,true));

test('E2','dangling placeId',()=>{
  const data=cleanData();data.ITINERARY_DATA[1].items[0].placeId='missing';
  assert(has(Engine.validateE2(data),'REL_TIMELINE_PLACE_DANGLING'));
});
test('E2','orphan Guide entry',()=>{
  const data=cleanData();data.GUIDE_ORDER=[];
  assert(has(Engine.validateE2(data),'REL_GUIDE_ENTRY_ORPHAN'));
});
test('E2','unreachable Guide place',()=>{
  const data=cleanData();data.CATEGORIES.SIGHTS=[];
  assert(has(Engine.validateE2(data),'REL_GUIDE_PLACE_UNREACHABLE'));
});
test('E2','non-place with place actions',()=>{
  const data=cleanData();data.ITINERARY_DATA[1].items=[{id:'instruction',nonPlace:true,guideIds:['p1']}];
  assert(has(Engine.validateE2(data),'REL_NON_PLACE_HAS_GUIDE'));
});
test('E2','ambiguous timeline item',()=>{
  const data=cleanData();data.ITINERARY_DATA[1].items=[{id:'unknown'}];
  assert(has(Engine.validateE2(data),'REL_TIMELINE_CLASSIFICATION_AMBIGUOUS'));
});
test('E2','clean dataset pass',()=>assert.equal(Engine.validateE2(cleanData()).valid,true));

function rentalData(overrides,actions){
  const booking=Object.assign({
    id:'rental-1',type:'rentalCar',standalone:true,provider:'Provider',
    pickupDateTime:'2030-01-01 09:00',pickupDepotAddress:'Pickup Depot',
    pickupNavigationDestination:'Pickup Depot',
    returnDateTime:'2030-01-02 17:00',returnDepotAddress:'Return Depot',
    returnNavigationDestination:'Return Depot',oneWay:true
  },overrides||{});
  return {BOOKINGS_DATA:{'rental-1':booking},NAVIGATION_ACTIONS:actions||[
    {id:'pickup',ownerId:'rental-1',role:'rental-pickup',destinationSource:'pickupNavigationDestination',destination:booking.pickupNavigationDestination,label:'Navigate to pickup depot'},
    {id:'return',ownerId:'rental-1',role:'rental-return',destinationSource:'returnNavigationDestination',destination:booking.returnNavigationDestination,label:'Navigate to return depot'}
  ]};
}
test('E3','missing navigation destination',()=>{
  const data=rentalData();data.NAVIGATION_ACTIONS[0].destination='';
  assert(has(Engine.validateE3(data),'NAV_DESTINATION_MISSING'));
});
test('E3','pickup action bound to return depot',()=>{
  const data=rentalData();data.NAVIGATION_ACTIONS[0].destination='Return Depot';
  assert(has(Engine.validateE3(data),'NAV_RENTAL_PICKUP_BINDING_INVALID'));
});
test('E3','return action bound to pickup depot',()=>{
  const data=rentalData();data.NAVIGATION_ACTIONS[1].destination='Pickup Depot';
  assert(has(Engine.validateE3(data),'NAV_RENTAL_RETURN_BINDING_INVALID'));
});
test('E3','ambiguous generic action with two depots',()=>{
  const data=rentalData();data.NAVIGATION_ACTIONS.forEach(action=>action.label='Navigate');
  assert(has(Engine.validateE3(data),'NAV_LABEL_AMBIGUOUS'));
});
test('E3','valid same-depot rental',()=>{
  const data=rentalData({sameDepot:true,oneWay:false,pickupDepotAddress:'Depot',returnDepotAddress:'Depot',pickupNavigationDestination:'Depot',returnNavigationDestination:'Depot'});
  data.NAVIGATION_ACTIONS[0].destination='Depot';data.NAVIGATION_ACTIONS[1].destination='Depot';
  assert.equal(Engine.validateE3(data).valid,true);
});
test('E3','valid one-way rental',()=>assert.equal(Engine.validateE3(rentalData()).valid,true));

test('E4','accommodation required field failure',()=>{
  const data={BOOKINGS_DATA:{a:{id:'a',type:'accommodation',placeId:'p1',checkIn:'14:00',checkOut:'10:00',stayDates:'1–2 Jan'}}};
  assert(has(Engine.validateE4(data),'BOOKING_ACCOMMODATION_PROPERTY_MISSING'));
});
test('E4','one-way rental missing return depot',()=>{
  const data=rentalData({returnDepotAddress:''});
  assert(has(Engine.validateE4(data),'BOOKING_RENTAL_RETURN_DEPOT_MISSING'));
});
test('E4','flight missing required endpoint',()=>{
  const data={BOOKINGS_DATA:{f:{id:'f',type:'flight',standalone:true,departureDateTime:'2030-01-01 09:00',departureAirport:'AAA',arrivalDateTime:'2030-01-01 11:00'}}};
  assert(has(Engine.validateE4(data),'BOOKING_FLIGHT_ARRIVAL_AIRPORT_MISSING'));
});
test('E4','activity missing required meeting information',()=>{
  const data={BOOKINGS_DATA:{t:{id:'t',type:'tour',title:'Tour',date:'2030-01-01',time:'09:00',standalone:true,requiresMeeting:true}}};
  assert(has(Engine.validateE4(data),'BOOKING_ACTIVITY_MEETING_MISSING'));
});
test('E4','optional fields do not block',()=>{
  const data=cleanData();delete data.BOOKINGS_DATA.b1.reference;delete data.BOOKINGS_DATA.b1.price;delete data.BOOKINGS_DATA.b1.cancellation;
  assert.equal(Engine.validateE4(data).valid,true);
});
test('E4','valid booking records pass',()=>{
  const data=rentalData();data.BOOKINGS_DATA.a={id:'a',type:'accommodation',placeId:'p1',title:'Hotel',checkIn:'14:00',checkOut:'10:00',stayDates:'1–2 Jan'};
  data.BOOKINGS_DATA.f={id:'f',type:'flight',standalone:true,departureDateTime:'2030-01-01 09:00',departureAirport:'AAA',arrivalDateTime:'2030-01-01 11:00',arrivalAirport:'BBB'};
  data.BOOKINGS_DATA.t={id:'t',type:'tour',title:'Tour',date:'2030-01-01',time:'09:00',standalone:true,requiresMeeting:true,meetingArrangement:'Hotel lobby'};
  assert.equal(Engine.validateE4(data).valid,true);
});

test('E5','valid non-place item',()=>{
  const data=cleanData();data.ITINERARY_DATA[1].items=[{id:'meal',nonPlace:true,nonPlaceRole:'operator-meal',title:'Packed lunch'}];
  assert.equal(Engine.validateE5(data).valid,true);
});
test('E5','non-place item with Guide relationship fails',()=>{
  const data=cleanData();data.ITINERARY_DATA[1].items=[{id:'meal',nonPlace:true,guideIds:['p1']}];
  assert(has(Engine.validateE5(data),'NONPLACE_HAS_GUIDE_RELATIONSHIP'));
});
test('E5','unknown item with no classification fails',()=>{
  const data=cleanData();data.ITINERARY_DATA[1].items=[{id:'unknown',title:'Unclear event'}];
  assert(has(Engine.validateE5(data),'NONPLACE_CLASSIFICATION_MISSING'));
});
test('E5','descriptive venue text is not silently auto-classified',()=>{
  const data=cleanData();const item={id:'unknown',title:'Dinner at Named Venue'};data.ITINERARY_DATA[1].items=[item];
  const result=Engine.validateE5(data);
  assert(has(result,'NONPLACE_POSSIBLE_NAMED_VENUE'));assert.equal(item.nonPlace,undefined);assert.equal(item.placeId,undefined);
});
test('E5','clean dataset pass',()=>assert.equal(Engine.validateE5(cleanData()).valid,true));

function planningData(records,group){
  return {
    PLANNING_GROUPS:{choice:Object.assign({id:'choice',type:'accommodation',primaryRequired:true},group||{})},
    PLANNING_RECORDS:Object.fromEntries(records.map(record=>[record.id,Object.assign({
      entityType:'planningCandidate',planningGroupId:'choice',planningRole:'alternative'
    },record)]))
  };
}
test('PLANNING','valid planning status',()=>{
  const data=planningData([{id:'a',planningStatus:'planned',planningRole:'primary'}]);
  assert.equal(Engine.validatePlanning(data).valid,true);
});
test('PLANNING','status omission retains RC19 behavior',()=>{
  assert.equal(Engine.validatePlanning(cleanData()).valid,true);
});
test('PLANNING','invalid status',()=>{
  const data=planningData([{id:'a',planningStatus:'maybe',planningRole:'primary'}]);
  assert(has(Engine.validatePlanning(data),'PLANNING_INVALID_STATUS'));
});
test('PLANNING','duplicate primary',()=>{
  const data=planningData([
    {id:'a',planningStatus:'planned',planningRole:'primary'},
    {id:'b',planningStatus:'backup',planningRole:'primary'}
  ]);
  assert(has(Engine.validatePlanning(data),'PLANNING_DUPLICATE_PRIMARY'));
});
test('PLANNING','duplicate confirmed',()=>{
  const data=planningData([
    {id:'a',planningStatus:'confirmed',planningRole:'primary'},
    {id:'b',planningStatus:'confirmed'}
  ]);
  assert(has(Engine.validatePlanning(data),'PLANNING_DUPLICATE_CONFIRMED'));
});
test('PLANNING','required group missing primary',()=>{
  const data=planningData([{id:'a',planningStatus:'planned'}]);
  assert(has(Engine.validatePlanning(data),'PLANNING_PRIMARY_MISSING'));
});
test('PLANNING','optional record may retain Guide booking and navigation relationships',()=>{
  const data=planningData([{id:'a',planningStatus:'optional',planningRole:'primary',guideIds:['guide'],bookingId:'booking',navigationDestination:'Destination'}]);
  assert.equal(Engine.validatePlanning(data).valid,true);
  assert.equal(Engine.isProductionEligible(data.PLANNING_RECORDS.a,'guide'),true);
  assert.equal(Engine.isProductionEligible(data.PLANNING_RECORDS.a,'selection'),false);
});
test('PLANNING','unselected optional booking does not inherit active requirements',()=>{
  const data={BOOKINGS_DATA:{option:{id:'option',type:'flight',planningStatus:'optional',standalone:true}}};
  assert.equal(Engine.validateE4(data).valid,true);
  assert.equal(Engine.validateE4(data).summary.deferredCandidates,1);
});
test('PLANNING','cancelled record stays editable but is excluded from production',()=>{
  const data=planningData([{id:'a',planningStatus:'cancelled',planningRole:'primary'}],{primaryRequired:false});
  assert.equal(Engine.validatePlanning(data).valid,true);
  assert.equal(Engine.isProductionEligible(data.PLANNING_RECORDS.a,'guide'),false);
  assert.equal(Engine.isProductionEligible(data.PLANNING_RECORDS.a,'confirmed-export'),false);
  assert.equal(Engine.isProductionEligible(data.PLANNING_RECORDS.a,'search'),true);
  assert.equal(Engine.isProductionEligible(data.PLANNING_RECORDS.a,'edit'),true);
});
test('PLANNING','cancelled active record fails',()=>{
  const data=planningData([{id:'a',planningStatus:'cancelled',planningRole:'primary',includeInExport:true}],{primaryRequired:false});
  assert(has(Engine.validatePlanning(data),'PLANNING_CANCELLED_ACTIVE'));
});
test('PLANNING','cancelled booking remains history rather than an active booking failure',()=>{
  const data={BOOKINGS_DATA:{old:{id:'old',type:'rentalCar',planningStatus:'cancelled',standalone:true}}};
  assert.equal(Engine.validateE4(data).valid,true);
  assert.equal(Engine.validateE3(data).summary.actions,0);
});
test('PLANNING','backup promotion revalidates full acceptance',()=>{
  const data=cleanData();
  data.PLACES.p2={id:'p2',title:'Second Place',planningStatus:'planned',planningGroupId:'stay-choice',planningRole:'primary'};
  Object.assign(data.PLACES.p1,{planningStatus:'backup',planningGroupId:'stay-choice',planningRole:'alternative'});
  data.GUIDE_ORDER.push('p2');data.CATEGORIES.SIGHTS.push({key:'p2'});
  data.PLANNING_GROUPS={'stay-choice':{id:'stay-choice',type:'accommodation',primaryRequired:true}};
  const promotion=Engine.promotePlanningRecord(data,{entityType:'place',entityId:'p1',planningStatus:'confirmed'},config());
  assert.equal(promotion.accepted,true);assert.equal(promotion.data.PLACES.p1.planningStatus,'confirmed');assert.equal(data.PLACES.p1.planningStatus,'backup');
});
test('PLANNING','alternative promotion changes primary without duplicates',()=>{
  const data=cleanData();
  data.PLACES.p2={id:'p2',title:'Second Place',planningStatus:'backup',planningGroupId:'stay-choice',planningRole:'alternative'};
  Object.assign(data.PLACES.p1,{planningStatus:'planned',planningGroupId:'stay-choice',planningRole:'primary'});
  data.GUIDE_ORDER.push('p2');data.CATEGORIES.SIGHTS.push({key:'p2'});
  data.PLANNING_GROUPS={'stay-choice':{id:'stay-choice',type:'accommodation',primaryRequired:true}};
  const promotion=Engine.promotePlanningRecord(data,{entityType:'place',entityId:'p2',planningRole:'primary'},config());
  assert.equal(promotion.accepted,true);assert.equal(promotion.data.PLACES.p2.planningRole,'primary');assert.equal(promotion.data.PLACES.p1.planningRole,'alternative');
});
test('PLANNING','conflicting confirmed promotion is rejected transactionally',()=>{
  const data=cleanData();
  data.PLACES.p2={id:'p2',title:'Second Place',planningStatus:'backup',planningGroupId:'stay-choice',planningRole:'alternative'};
  Object.assign(data.PLACES.p1,{planningStatus:'confirmed',planningGroupId:'stay-choice',planningRole:'primary'});
  data.GUIDE_ORDER.push('p2');data.CATEGORIES.SIGHTS.push({key:'p2'});
  data.PLANNING_GROUPS={'stay-choice':{id:'stay-choice',type:'accommodation',primaryRequired:true}};
  const promotion=Engine.promotePlanningRecord(data,{entityType:'place',entityId:'p2',planningStatus:'confirmed'},config());
  assert.equal(promotion.accepted,false);assert(has(promotion.result.stages.PLANNING,'PLANNING_DUPLICATE_CONFIRMED'));
  assert.equal(promotion.data.PLACES.p2.planningStatus,'backup');
});

function loadProduction(){
  const context={console};context.globalThis=context;vm.createContext(context);
  for(const name of ['theme-config.js','asset-config.js','locale-config.js','trip-config.js','data.js']){
    vm.runInContext(fs.readFileSync(path.join(__dirname,name),'utf8'),context,{filename:name});
  }
  return {data:context.TRAVEL_DATASETS,config:context.TRIP_CONFIG};
}
test('INTEGRATION','complete RC19 regression dataset passes with Planning Semantics',()=>{
  const production=loadProduction();
  const result=Engine.validateTripData(production.data,production.config);
  assert.equal(result.valid,true,Engine.formatValidationReport(result));
});
test('INTEGRATION','failure report contains stage and issue codes',()=>{
  const data=cleanData();data.ITINERARY_DATA[1].items=[{id:'unknown',title:'Named Venue'}];
  const result=Engine.validateTripData(data,config());
  const report=Engine.formatValidationReport(result);
  assert.match(report,/Stage: E[1-5]/);assert.match(report,/NONPLACE_CLASSIFICATION_MISSING/);
});
test('INTEGRATION','structured result exposes counts and stage results',()=>{
  const result=Engine.validateTripData(cleanData(),config());
  assert.equal(result.valid,true);assert.equal(result.blockingErrorCount,0);assert(result.stages.E1);assert(result.summary.entityCounts);
});
test('INTEGRATION','acceptance entry point blocks invalid generation data',()=>{
  const data=cleanData();data.ITINERARY_DATA[1].items=[{id:'unknown'}];
  assert.throws(()=>Engine.acceptTripData(data,config()),error=>error.name==='TravelEngineIntegrityError'&&error.validationResult.valid===false);
});

let passed=0;
for(const stage of [...Engine.STAGES,'INTEGRATION']){
  const suite=tests.filter(entry=>entry.stage===stage);
  for(const entry of suite){
    try{entry.fn();passed++;process.stdout.write(`PASS ${stage} — ${entry.name}\n`);}
    catch(error){process.stderr.write(`FAIL ${stage} — ${entry.name}\n${error.stack}\n`);process.exitCode=1;}
  }
  if(!process.exitCode)process.stdout.write(`CHECKPOINT ${stage}: ${suite.length}/${suite.length} passed\n`);
}
if(!process.exitCode)process.stdout.write(`PASS Engine Integrity tests: ${passed}/${tests.length}\n`);
