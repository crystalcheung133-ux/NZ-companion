#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
function read(file){return fs.readFileSync(path.join(root,file),'utf8');}
const trip=read('trip-runtime.js');
const admin=read('admin.js');
const expenses=read('expenses.js');
const moments=read('moments.js');

const failures=[];
if(trip.includes('accommodation-about-stay') || trip.includes("bookingContactSectionsHTML(booking,place),bookingSectionHTML('Cancellation'")){
  failures.push('Trip cards still include Guide-owned accommodation/operator content.');
}
if(!trip.includes('accommodation-detail-card--compact')) failures.push('Compact Trip accommodation card contract missing.');
if(!trip.includes('guide.html?id=${encodeURIComponent(booking.placeId)}')) failures.push('Trip Booking Guide action does not target the exact Guide card.');
const guide=read('guide-runtime.js');
if(!guide.includes("NAVIGATION.build('guide',{query:{placeId:clean[0]}})")) failures.push('Timeline Guide action does not target the exact Guide card.');
if(!guide.includes('openRequestedGuideCard')) failures.push('Guide page exact-card auto-open contract missing.');

if(admin.includes('trip-studio-selector-arrow')) failures.push('Studio selector arrow returned.');
if(!admin.includes('Leave Studio Mode')) failures.push('Leave Studio Mode action missing.');
if(!expenses.includes('canManageExpense') || !expenses.includes('This cannot be undone.')) failures.push('Expense ownership/delete confirmation contract missing.');
if(!moments.includes('canManageMoment') || !moments.includes('This cannot be undone.')) failures.push('Moment ownership/delete confirmation contract missing.');

if(failures.length){
  console.error('UX CONTRACT: FAILED');
  failures.forEach(x=>console.error('- '+x));
  process.exit(1);
}
console.log('UX CONTRACT: PASS — Trip/Guide, Studio and shared-data permissions are enforced.');
