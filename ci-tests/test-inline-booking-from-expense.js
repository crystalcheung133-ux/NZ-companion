const fs=require('fs'),assert=require('assert');
const e=fs.readFileSync('expenses.js','utf8'),h=fs.readFileSync('expenses.html','utf8'),t=fs.readFileSync('trip-runtime.js','utf8');
assert(e.includes('openExpenseSourceBooking'));
assert(e.includes('onclick="openExpenseSourceBooking'));
assert(!e.includes('href="trip.html?bookingId='));
assert(h.includes('id="tripModal"'));
assert(h.includes('trip-runtime.js'));
assert(t.includes('window.returnToBookingDetail=returnToBookingDetail'));
console.log('INLINE BOOKING FROM EXPENSE CONTRACT: PASS');