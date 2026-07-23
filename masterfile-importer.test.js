/* Dependency-free tests for RC22 Master File Importer V1. */
const assert=require('node:assert/strict');
const Importer=require('./masterfile-importer.js');
const Engine=require('./engine-integrity.js');
const Adapter=require('./generation-selection-adapter.js');
const tests=[];
const test=(name,fn)=>tests.push({name,fn});
const hasQuestion=(result,code)=>result.questions.some(item=>item.code===code);
const hasWarning=(result,code)=>result.warnings.some(item=>item.code===code);

const completeMaster=`# Trip
Trip Name: Example Family Journey
Destination: Example Country
Start Date: 2030-01-01
End Date: 2030-01-04
Version: RC22

## Accommodation
### Harbour Hotel
Day: 1
Address: 1 Harbour Road
Check-in: 14:00
Check-out: 10:00
Stay Dates: 1–2 Jan 2030
Reference: HOTEL-ONE
Description: Quiet waterfront rooms — keep this wording unchanged.

## Restaurant
### Market Kitchen
Day: 1
Address: 2 Market Lane
Description: Family dinner with the original menu notes.

## Activity
### Museum Visit
Day: 2
Time: 10:00
Address: 3 Museum Street
Description: Explore at your own pace.

## Rental
### Example Car Hire
Provider: Example Car Hire
Reference: CAR-ONE
Pickup Date/Time: 2030-01-01 09:00
Pickup Depot: 10 Start Road
Pickup Navigation: 10 Start Road
Return Date/Time: 2030-01-04 17:00
Return Depot: 20 Finish Road
Return Navigation: 20 Finish Road

## Flights
### EX101 Outbound
Departure Time: 2030-01-01 06:00
Departure Airport: AAA
Arrival Time: 2030-01-01 08:00
Arrival Airport: BBB
Airline: Example Air
Flight Number: EX101

## Transport
### Transfer to hotel
Day: 1
Time: 09:30
Notes: Meet the driver outside arrivals.

## Notes
### Weather note
- Carry the original rain note exactly.
`;

test('parses flexible section ordering',()=>{
  const parsed=Importer.parse('## Flights\n### AB1\n\n## Trip\nTrip Name: Test');
  assert.deepEqual(parsed.sections.map(section=>section.type),['flight','trip']);
});
test('normalizes accommodation',()=>{
  const result=Importer.import(completeMaster);
  assert.equal(result.canonicalData.BOOKINGS_DATA['harbour-hotel-booking'].type,'accommodation');
  assert.equal(result.canonicalData.PLACES['harbour-hotel'].cat,'STAY');
});
test('normalizes restaurant as Guide place',()=>{
  const result=Importer.import(completeMaster);
  assert.equal(result.canonicalData.PLACES['market-kitchen'].cat,'DINING');
  assert(result.canonicalData.CATEGORIES.DINING.some(entry=>entry.key==='market-kitchen'));
});
test('normalizes activity entity and place',()=>{
  const result=Importer.import(completeMaster);
  assert(result.canonicalData.ACTIVITIES['museum-visit']);
  assert(result.canonicalData.PLACES['museum-visit']);
});
test('normalizes flight booking',()=>{
  const booking=Importer.import(completeMaster).canonicalData.BOOKINGS_DATA['ex101-outbound-booking'];
  assert.equal(booking.type,'flight');assert.equal(booking.departureAirport,'AAA');assert.equal(booking.arrivalAirport,'BBB');
});
test('normalizes rental pickup and return independently',()=>{
  const result=Importer.import(completeMaster);
  const booking=result.canonicalData.BOOKINGS_DATA['example-car-hire-booking'];
  assert.equal(booking.pickupDepotAddress,'10 Start Road');assert.equal(booking.returnDepotAddress,'20 Finish Road');
  assert.deepEqual(result.canonicalData.NAVIGATION_ACTIONS.map(action=>action.role),['rental-pickup','rental-return']);
});
test('builds Day and Guide relationships',()=>{
  const data=Importer.import(completeMaster).canonicalData;
  assert(data.ITINERARY_DATA['1'].items.some(item=>item.placeId==='market-kitchen'));
  assert.deepEqual(data.DAY_LINKS['market-kitchen'],[['Day 1','day.html?day=1']]);
  assert(data.CANONICAL_REFERENCES.some(reference=>reference.entityId==='harbour-hotel-booking'));
});
test('preserves original wording',()=>{
  const result=Importer.import(completeMaster);
  const place=result.canonicalData.PLACES['harbour-hotel'];
  assert.equal(place.description,'Quiet waterfront rooms — keep this wording unchanged.');
  assert(place.sourceWording.text.includes('Quiet waterfront rooms — keep this wording unchanged.'));
});
test('backup wording generates a question without applying status',()=>{
  const result=Importer.import('## Accommodation\n### Archway Backup\nAddress: 1 Road\nCheck-in: 2pm\nCheck-out: 10am\nStay Dates: One night');
  assert(hasQuestion(result,'IMPORT_PLANNING_STATUS_AMBIGUOUS'));
  assert.equal(result.canonicalData.PLACES['archway-backup'].planningStatus,undefined);
});
test('optional activity wording generates a question',()=>{
  const result=Importer.import('Activity\nHorse Riding\nMaybe\nDay: 2\nAddress: Riding Centre');
  assert(hasQuestion(result,'IMPORT_PLANNING_STATUS_AMBIGUOUS'));
});
test('compact preferred and backup records generate a group question',()=>{
  const result=Importer.import('Accommodation\nEdgewater\nPreferred\nArchway\nBackup');
  assert(hasQuestion(result,'IMPORT_PLANNING_GROUP_AMBIGUOUS'));
  assert.equal(result.canonicalData.PLACES.edgewater.planningStatus,undefined);
  assert.equal(result.canonicalData.PLACES.archway.planningStatus,undefined);
});
test('explicit planning status is translated but not validated',()=>{
  const result=Importer.import('## Restaurant\n### Cafe One\nAddress: 1 Road\nPlanning Status: optional');
  assert.equal(result.canonicalData.PLACES['cafe-one'].planningStatus,'optional');
  assert(!hasQuestion(result,'IMPORT_PLANNING_STATUS_AMBIGUOUS'));
});
test('alternative wording generates a planning-group question',()=>{
  const result=Importer.import('## Restaurant\n### Kika or Big Fig\nDay: 2');
  assert(hasQuestion(result,'IMPORT_ALTERNATIVES_AMBIGUOUS'));
});
test('unknown sections are preserved and questioned',()=>{
  const result=Importer.import('## Packing Rituals\n### Family tradition\n- Keep this note.');
  assert(hasWarning(result,'IMPORT_SECTION_UNKNOWN'));
  assert(hasQuestion(result,'IMPORT_SECTION_REVIEW_REQUIRED'));
  assert(result.canonicalData.NOTES.some(note=>note.unresolvedSection));
});
test('malformed and empty input return warnings rather than throwing',()=>{
  assert(hasWarning(Importer.import(''),'IMPORT_INPUT_EMPTY'));
  const result=Importer.import('unstructured wording only');
  assert(hasWarning(result,'IMPORT_SECTION_UNKNOWN'));
});
test('ambiguous activity does not become a fake place',()=>{
  const result=Importer.import('## Activity\n### Named Experience\nDay: 1');
  assert.equal(result.canonicalData.PLACES['named-experience'],undefined);
  assert(hasQuestion(result,'IMPORT_ACTIVITY_CLASSIFICATION_AMBIGUOUS'));
});
test('missing flight endpoint generates a question',()=>{
  const result=Importer.import('## Flight\n### AB1\nDeparture Time: Tomorrow\nDeparture Airport: AAA\nArrival Time: Later');
  assert(hasQuestion(result,'IMPORT_FLIGHT_ARRIVAL_AMBIGUOUS'));
});
test('rental address is not silently reused as navigation',()=>{
  const result=Importer.import('## Rental\n### Hire Car\nPickup Depot: A Road\nReturn Depot: B Road');
  assert.equal(result.canonicalData.NAVIGATION_ACTIONS.length,0);
  assert.equal(result.questions.filter(item=>item.code==='IMPORT_RENTAL_NAVIGATION_MISSING').length,2);
});
test('generic airport pickup generates a location question',()=>{
  const result=Importer.import('Rental\nHire Car\nPickup: Airport\nReturn: City Centre');
  assert.equal(result.questions.filter(item=>item.code==='IMPORT_LOCATION_AMBIGUOUS').length,2);
});
test('question structure includes reason suggestion and confidence',()=>{
  const q=Importer.import('## Activity\n### Maybe Kayaking\nDay: 1').questions[0];
  assert(q.reason);assert(q.suggestedInterpretation);assert.equal(typeof q.confidence,'number');
});
test('formatReport includes statistics and questions',()=>{
  const report=Importer.formatReport(Importer.import('## Activity\n### Maybe Kayaking\nDay: 1'));
  assert(report.includes('Unresolved questions:'));assert(report.includes('IMPORT_PLANNING_STATUS_AMBIGUOUS'));
});
test('complete imported dataset passes RC19 and RC20',()=>{
  const result=Importer.import(completeMaster);
  const acceptance=Engine.acceptTripData(result.canonicalData,result.config);
  assert.equal(acceptance.status,'PASS');
});
test('accepted imported dataset rebuilds through RC21',()=>{
  const result=Importer.import(completeMaster);
  Engine.acceptTripData(result.canonicalData,result.config);
  const projection=Adapter.rebuild(result.canonicalData,result.config);
  assert.equal(projection.acceptance.status,'PASS');
  assert(Object.isFrozen(projection));
});

(async()=>{
  let passed=0;
  for(const entry of tests){
    try{await entry.fn();passed++;console.log(`PASS IMPORTER — ${entry.name}`);}
    catch(error){console.error(`FAIL IMPORTER — ${entry.name}\n${error.stack||error}`);process.exitCode=1;}
  }
  console.log(`${passed}/${tests.length} Master File Importer tests passed.`);
})();

