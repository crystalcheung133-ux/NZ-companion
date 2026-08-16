#!/usr/bin/env node
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
let source = fs.readFileSync(path.join(root, 'data.js'), 'utf8');
source += '\nthis.__ITINERARY_DATA = ITINERARY_DATA;';
const ctx = {};
vm.createContext(ctx);
vm.runInContext(source, ctx);
const days = ctx.__ITINERARY_DATA;

function minutes(label) {
  if (!label) return null;
  const m = String(label).match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ap = m[3] && m[3].toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

let failures = [];
for (const [dayNo, day] of Object.entries(days)) {
  let last = null;
  for (const item of day.items) {
    const current = minutes(item.time);
    if (current === null) continue;
    if (last !== null && current < last) {
      failures.push(`Day ${dayNo}: ${item.time} (${item.title}) occurs before previous explicit time.`);
    }
    last = current;
  }
}

function assertOrder(dayNo, ids) {
  const actual = days[dayNo].items.map(item => item.id);
  let cursor = -1;
  for (const id of ids) {
    const idx = actual.indexOf(id);
    if (idx < 0) failures.push(`Day ${dayNo}: missing item ${id}`);
    else if (idx <= cursor) failures.push(`Day ${dayNo}: ${id} is out of order`);
    cursor = idx;
  }
}

assertOrder('3', ['alpine-salmon', 'ultimate-alpine-flight', 'hooker-valley', 'mt-cook-simple-lunch']);
assertOrder('8', ['airbnb-breakfast-d8', 'queenstown-fuel-check', 'depart-queenstown', 'kingston-pit-stop', 'te-anau-lunch', 'lakefront-lodge']);
assertOrder('10', ['departure-breakfast', 'checkout-lakefront', 'depart-te-anau', 'departure-lunch', 'final-refuel', 'car-return', 'airport-shuttle', 'flight-home']);

if (failures.length) {
  console.error('TIMELINE INTEGRITY: FAILED');
  failures.forEach(f => console.error(`- ${f}`));
  process.exit(1);
}
console.log('TIMELINE INTEGRITY: PASS — explicit times are monotonic and critical transfer sequences are ordered.');
