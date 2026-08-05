#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const repoRoot=path.resolve(__dirname,'..');
function read(file){return fs.readFileSync(path.join(repoRoot,file),'utf8');}
const trip=read('trip-runtime.js');
const admin=read('admin.js');
const expenses=read('expenses.js');
const moments=read('moments.js');
const data=read('data.js');
const guide=read('guide-runtime.js');
const tripConfig=read('trip-config.js');
const failures=[];
if(trip.includes('accommodation-about-stay') || trip.includes("bookingContactSectionsHTML(booking,place),bookingSectionHTML('Cancellation'")) failures.push('Trip cards still include Guide-owned accommodation/operator content.');
if(!trip.includes('accommodation-detail-card--compact')) failures.push('Compact Trip accommodation card contract missing.');
// RC24.6: Check-in/Reception/Arrival-instruction copy was intentionally removed from Trip Accommodation
// (operational-only screen). This guards it does not return, rather than guarding it exists.
if(trip.includes('usefulCheckInInstructions') || trip.includes("bookingSectionHTML('Check-in notes'")) failures.push('Trip Accommodation regained descriptive check-in copy (RC24.6 removed this).');
if(!trip.includes("booking.bookingUrl")) failures.push('Open Booking button contract missing.');
if(!guide.includes("g.cat==='STAY'?'':")) failures.push('Guide STAY header-description duplication guard missing.');
if(!data.includes('"checkIn":"2:00 PM","checkOut":"10:00 AM"')) failures.push('Sudima check-in/check-out contract missing.');
// RC24.4 confirmed-stay cleanup
if(!data.includes('"ACTIVITIES":[{"key":"ultimate-alpine"},{"key":"hooker-valley"}')) failures.push('Ultimate Alpine Guide missing from Activities.');
if(data.includes('"white-water-rafting"')) failures.push('Cancelled White Water Rafting still exists in active data.');
if(tripConfig.includes('white-water-rafting')) failures.push('Orphan White Water Rafting reference still exists in trip-config.js.');
if(data.includes('"archway"') || data.includes('"archway-booking"')) failures.push('Cancelled Archway accommodation still exists in active data.');
if(!data.includes('"edgewater-booking"') || !data.includes('"guideStatus":"confirmed"')) failures.push('Edgewater confirmed contract missing.');
if(admin.includes('trip-studio-selector-arrow')) failures.push('Studio selector arrow returned.');
if(!admin.includes('Leave Studio Mode')) failures.push('Leave Studio Mode action missing.');
if(!expenses.includes('canManageExpense') || !expenses.includes('This cannot be undone.')) failures.push('Expense ownership/delete confirmation contract missing.');
if(!moments.includes('canManageMoment') || !moments.includes('This cannot be undone.')) failures.push('Moment ownership/delete confirmation contract missing.');
if(failures.length){console.error('UX CONTRACT: FAILED');failures.forEach(x=>console.error('- '+x));process.exit(1);}
console.log('UX CONTRACT: PASS — Trip/Guide, Studio and shared-data permissions are enforced.');
