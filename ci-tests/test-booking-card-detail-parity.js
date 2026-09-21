const fs=require('fs');
const s=fs.readFileSync('trip-runtime.js','utf8');
const required=[
  "bookingContactSectionsHTML(booking,null)",
  "bookingConsolidatedNotes(booking)",
  "bookingSectionHTML('Original total',booking.originalTotal||'')",
  "bookingSectionHTML('Discount',booking.discount||'')"
];
for(const x of required){if(!s.includes(x)){console.error('FAIL booking card detail parity:',x);process.exit(1);}}
const contact=s.slice(s.indexOf('function bookingContactSectionsHTML'),s.indexOf('function buildAccommodationDetailHTML'));
for(const f of ['booking.phone','booking.email','booking.website']){if(!contact.includes(f)){console.error('FAIL contact field not rendered:',f);process.exit(1);}}
console.log('PASS booking card detail parity');
