#!/usr/bin/env node
/* Travel Engine — data.js entity-linkage regression test.
   Loads the real PLACES / CATEGORIES / GUIDE_ORDER / DAY_LINKS / FRIENDS /
   BOOKINGS_DATA / ITINERARY_DATA objects from data.js in a sandbox and
   checks cross-references for orphans. Reviewed against the
   BOOKING-SAVE-ROOTFIX1 baseline's actual data.js structure (all seven
   top-level consts confirmed present under these exact names) before use —
   not blindly carried over from a previous baseline. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dataPath = path.join(__dirname, '..', 'data.js');
const source = fs.readFileSync(dataPath, 'utf8');

const exportNames = ['PLACES', 'CATEGORIES', 'GUIDE_ORDER', 'DAY_LINKS', 'FRIENDS', 'BOOKINGS_DATA', 'TRIP_DATA', 'TRIP_ORDER', 'ITINERARY_DATA'];
const exportShim = '\n;' + exportNames.map(n => `try{this.${n}=${n};}catch(e){}`).join('');

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(source + exportShim, sandbox, { filename: 'data.js' });

const { PLACES, CATEGORIES, GUIDE_ORDER, DAY_LINKS, FRIENDS, BOOKINGS_DATA, ITINERARY_DATA } = sandbox;
if (!PLACES || !BOOKINGS_DATA || !ITINERARY_DATA) {
  console.error('FAIL: could not load expected top-level consts from data.js — file structure may have changed');
  process.exit(1);
}

let failures = 0;
function fail(msg) { failures++; console.error('FAIL: ' + msg); }
function ok(msg) { console.log('PASS: ' + msg); }

// 1. Every CATEGORIES key must exist in PLACES
for (const [cat, entries] of Object.entries(CATEGORIES)) {
  for (const { key } of entries) {
    if (!(key in PLACES)) fail(`CATEGORIES.${cat} references unknown place "${key}"`);
  }
}
ok('CATEGORIES → PLACES linkage checked');

// 2. Every GUIDE_ORDER entry must exist in PLACES
for (const key of GUIDE_ORDER) {
  if (!(key in PLACES)) fail(`GUIDE_ORDER references unknown place "${key}"`);
}
ok('GUIDE_ORDER → PLACES linkage checked');

// 3. Every DAY_LINKS key must exist in PLACES
for (const key of Object.keys(DAY_LINKS)) {
  if (!(key in PLACES)) fail(`DAY_LINKS references unknown place "${key}"`);
}
ok('DAY_LINKS → PLACES linkage checked');

// 4. Every BOOKINGS_DATA.placeId (when set) must exist in PLACES
for (const [id, booking] of Object.entries(BOOKINGS_DATA)) {
  if (booking.placeId != null && !(booking.placeId in PLACES)) {
    fail(`BOOKINGS_DATA.${id}.placeId "${booking.placeId}" not found in PLACES`);
  }
}
ok('BOOKINGS_DATA.placeId → PLACES linkage checked');

// 5. Every ITINERARY_DATA item's placeId / bookingId / guideIds must resolve
for (const [dayNum, day] of Object.entries(ITINERARY_DATA)) {
  for (const item of day.items || []) {
    if (item.placeId != null && !(item.placeId in PLACES)) {
      fail(`Day ${dayNum} item "${item.id}" placeId "${item.placeId}" not found in PLACES`);
    }
    if (item.bookingId != null && !(item.bookingId in BOOKINGS_DATA)) {
      fail(`Day ${dayNum} item "${item.id}" bookingId "${item.bookingId}" not found in BOOKINGS_DATA`);
    }
    for (const gid of item.guideIds || []) {
      if (!(gid in PLACES)) fail(`Day ${dayNum} item "${item.id}" guideIds entry "${gid}" not found in PLACES`);
    }
    if (item.dayId !== `day${dayNum}`) {
      fail(`Day ${dayNum} item "${item.id}" has dayId "${item.dayId}", expected "day${dayNum}"`);
    }
  }
}
ok('ITINERARY_DATA item linkage (placeId/bookingId/guideIds/dayId) checked');

// 6. Every BOOKINGS_DATA entry with a dayId must match a day that actually exists
for (const [id, booking] of Object.entries(BOOKINGS_DATA)) {
  if (booking.dayId != null) {
    const dayNum = booking.dayId.replace('day', '');
    if (!(dayNum in ITINERARY_DATA)) fail(`BOOKINGS_DATA.${id}.dayId "${booking.dayId}" has no matching ITINERARY_DATA day`);
  }
}
ok('BOOKINGS_DATA.dayId → ITINERARY_DATA linkage checked');

// 7. Every BOOKINGS_DATA entry with a timelineItemId must match a real itinerary item id
for (const [id, booking] of Object.entries(BOOKINGS_DATA)) {
  if (booking.timelineItemId != null) {
    const day = ITINERARY_DATA[booking.dayId ? booking.dayId.replace('day', '') : ''];
    const found = day && (day.items || []).some(i => i.id === booking.timelineItemId);
    if (!found) fail(`BOOKINGS_DATA.${id}.timelineItemId "${booking.timelineItemId}" not found in its declared day`);
  }
}
ok('BOOKINGS_DATA.timelineItemId linkage checked');

// 8. familyBreakdown reconciliation — sum of family totals must equal the booking's stated total (numeric, currency-agnostic)
function parseMoney(str) {
  const m = String(str || '').match(/[\d,]+(\.\d+)?/);
  return m ? parseFloat(m[0].replace(/,/g, '')) : null;
}
for (const [id, booking] of Object.entries(BOOKINGS_DATA)) {
  if (Array.isArray(booking.familyBreakdown) && booking.familyBreakdown.length) {
    const sum = booking.familyBreakdown.reduce((s, f) => s + (parseMoney(f.total) || 0), 0);
    const total = parseMoney(booking.price);
    if (total != null && Math.abs(sum - total) > 0.01) {
      fail(`BOOKINGS_DATA.${id} familyBreakdown sums to ${sum} but price states ${total}`);
    }
    for (const f of booking.familyBreakdown) {
      if (!(f.partyId in FRIENDS)) fail(`BOOKINGS_DATA.${id} familyBreakdown references unknown party "${f.partyId}"`);
    }
  }
}
ok('familyBreakdown reconciliation + party-ID validity checked');

// 9. FRIENDS sanity
const friendKeys = Object.keys(FRIENDS);
if (friendKeys.length === 0) fail('FRIENDS object is empty');
ok(`FRIENDS declares ${friendKeys.length} parties: ${friendKeys.join(', ')}`);

console.log('');
if (failures > 0) {
  console.error(`ENTITY INTEGRITY: FAILED (${failures} issue${failures === 1 ? '' : 's'})`);
  process.exit(1);
} else {
  console.log('ENTITY INTEGRITY: PASS — all placeId/bookingId/guideIds/dayId/timelineItemId/familyBreakdown checks clean');
  process.exit(0);
}
