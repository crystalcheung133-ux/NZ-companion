const fs=require('fs'),assert=require('assert');
const expenses=fs.readFileSync('expenses.js','utf8');
const trip=fs.readFileSync('trip-runtime.js','utf8');
assert(expenses.includes("window.openBookingExpense=function(bookingId)"),'booking → expense prefill API missing');
assert(expenses.includes("sourceBookingId:booking.id"),'booking source metadata missing');
assert(expenses.includes("sourceType:'booking'"),'sourceType booking missing');
assert(expenses.includes("From booking"),'transaction history source badge missing');
assert(trip.includes("Add payment to Expenses"),'booking action button missing');
assert(trip.includes("${bookingActionButtonsHTML(booking,place,{includeDay:false})}${bookingExpenseActionHTML(booking)}${accommodationDetailNavigationHTML(booking.id)}"),
  'accommodation detail must render booking → expense action before Previous/Next navigation');
assert(trip.includes("getBookingExpenseLinks"),'booking linked-payment state missing');
console.log('BOOKING ↔ EXPENSE LINKAGE CONTRACT: PASS');
