/* Dependency-free tests for the RC21 Generation Selection Adapter. */
const assert=require('node:assert/strict');
const Adapter=require('./generation-selection-adapter.js');
const tests=[];
const test=(name,fn)=>tests.push({name,fn});
const clone=value=>JSON.parse(JSON.stringify(value));
const config=()=>({tripName:'Adapter Test',startDate:'2030-01-01',endDate:'2030-01-02',version:'RC21'});
function data(){
  return {
    PLACES:{
      p1:{id:'p1',title:'Primary',planningStatus:'confirmed',planningGroupId:'stay',planningRole:'primary'},
      p2:{id:'p2',title:'Backup',planningStatus:'backup',planningGroupId:'stay',planningRole:'alternative'},
      p3:{id:'p3',title:'Optional',planningStatus:'optional'}
    },
    PLANNING_GROUPS:{stay:{id:'stay',type:'accommodation',primaryRequired:true}},
    CATEGORIES:{STAY:[{key:'p1'},{key:'p2'},{key:'p3'}]},
    GUIDE_ORDER:['p1','p2','p3'],
    DAY_LINKS:{p1:[[1,'day.html?day=1']],p2:[[1,'day.html?day=1']],p3:[[1,'day.html?day=1']]},
    ITINERARY_DATA:{1:{id:'day1',items:[
      {id:'confirmed-item',placeId:'p1',title:'Confirmed',planningStatus:'confirmed'},
      {id:'planned-item',placeId:'p1',title:'Planned',planningStatus:'planned'},
      {id:'backup-item',placeId:'p2',title:'Backup',planningStatus:'backup'},
      {id:'optional-item',placeId:'p3',title:'Optional',planningStatus:'optional'},
      {id:'cancelled-item',nonPlace:true,nonPlaceRole:'free-time',title:'Cancelled',planningStatus:'cancelled'}
    ]}},
    BOOKINGS_DATA:{
      b1:{id:'b1',type:'accommodation',title:'Hotel',placeId:'p1',checkIn:'14:00',checkOut:'10:00',stayDates:'1–2 Jan',planningStatus:'confirmed'},
      b2:{id:'b2',type:'accommodation',title:'Backup hotel',placeId:'p2',checkIn:'14:00',checkOut:'10:00',stayDates:'1–2 Jan',planningStatus:'backup'}
    },
    TRIP_DATA:{
      confirmed:{id:'confirmed',title:'Confirmed card',planningStatus:'confirmed'},
      backup:{id:'backup',title:'Backup card',planningStatus:'backup'}
    },
    TRIP_ORDER:['confirmed','backup'],
    NAVIGATION_ACTIONS:[
      {id:'nav1',ownerId:'p1',role:'place',destinationSource:'address',destination:'One Street',label:'Navigate to Primary',planningStatus:'confirmed'},
      {id:'nav2',ownerId:'p2',role:'place',destinationSource:'address',destination:'Two Street',label:'Navigate to Backup',planningStatus:'backup'}
    ]
  };
}
const build=()=>Adapter.createProductionProjection(data(),config());
const itemIds=p=>p.itinerary.days[1].items.map(item=>item.id);

test('projection generation passes',()=>assert.equal(Adapter.validateProductionProjection(build(),data(),config()).valid,true));
test('projection is deeply immutable',()=>{
  const p=build();assert(Object.isFrozen(p));assert(Object.isFrozen(p.guide.places));assert(Object.isFrozen(p.itinerary.days[1].items));
  p.guide.places.p1.title='Changed';assert.equal(p.guide.places.p1.title,'Primary');
});
test('confirmed records are included',()=>assert(itemIds(build()).includes('confirmed-item')));
test('planned records are included',()=>assert(itemIds(build()).includes('planned-item')));
test('backup records are excluded',()=>assert(!itemIds(build()).includes('backup-item')));
test('optional records are excluded by default',()=>assert(!itemIds(build()).includes('optional-item')));
test('cancelled records are always excluded',()=>assert(!itemIds(build()).includes('cancelled-item')));
test('Guide projection applies shared selection',()=>assert.deepEqual(Object.keys(build().guide.places),['p1']));
test('Trip projection applies shared selection',()=>assert.deepEqual(build().trip.order,['confirmed']));
test('Booking projection applies shared selection',()=>assert.deepEqual(build().bookings.order,['b1']));
test('Navigation projection applies shared selection',()=>assert.deepEqual(build().navigation.actions.map(action=>action.id),['nav1']));
test('Export projection is consistent',()=>{
  const p=build();assert.deepEqual(p.export.itinerary,p.itinerary.days);assert.deepEqual(p.export.bookings,p.bookings);
});
test('AI projection exposes production records only',()=>assert.deepEqual(Object.keys(build().ai.guide.places),['p1']));
test('promotion rebuild updates selection without mutating original',()=>{
  const source=data();source.PLACES.p1.planningStatus='planned';
  Adapter.rebuild(source,config());
  const result=Adapter.promoteAndRebuild({entityType:'place',entityId:'p2',planningStatus:'confirmed',planningRole:'primary'});
  assert.equal(result.accepted,true);
  assert.equal(source.PLACES.p2.planningStatus,'backup');
  assert.deepEqual(Object.keys(result.projection.guide.places),['p1','p2']);
  assert.equal(result.data.PLACES.p1.planningRole,'alternative');
});
test('duplicate production entity is reported',()=>{
  const p=clone(build());p.guide.order.push('p1');Object.freeze(p);
  assert(Adapter.validateProductionProjection(p,data(),config()).errors.some(issue=>issue.code==='PROJECTION_DUPLICATE'));
});
test('cancelled leakage is reported',()=>{
  const source=data(),p=clone(build());p.itinerary.days[1].items.push(clone(source.ITINERARY_DATA[1].items[4]));Object.freeze(p);
  assert(Adapter.validateProductionProjection(p,source,config()).errors.some(issue=>issue.code==='PROJECTION_CANCELLED_VISIBLE'));
});
test('backup leakage is reported',()=>{
  const source=data(),p=clone(build());p.bookings.byId.b2=clone(source.BOOKINGS_DATA.b2);Object.freeze(p);
  assert(Adapter.validateProductionProjection(p,source,config()).errors.some(issue=>issue.code==='PROJECTION_BACKUP_VISIBLE'));
});
test('missing canonical source is reported',()=>{
  const source=data(),p=clone(build());p.guide.places.ghost={id:'ghost'};Object.freeze(p);
  assert(Adapter.validateProductionProjection(p,source,config()).errors.some(issue=>issue.code==='PROJECTION_SOURCE_MISSING'));
});
test('projection inconsistency is reported',()=>{
  const source=data(),p=clone(build());delete p.export.itinerary[1];Object.freeze(p);
  assert(Adapter.validateProductionProjection(p,source,config()).errors.some(issue=>issue.code==='PROJECTION_INCONSISTENT'));
});

(async()=>{
  let passed=0;
  for(const entry of tests){
    try{await entry.fn();passed++;console.log(`PASS PROJECTION — ${entry.name}`);}
    catch(error){console.error(`FAIL PROJECTION — ${entry.name}\n${error.stack||error}`);process.exitCode=1;}
  }
  console.log(`${passed}/${tests.length} Generation Adapter tests passed.`);
})();
