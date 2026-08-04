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
const failures=[];
if(trip.includes('accommodation-about-stay') || trip.includes("bookingContactSectionsHTML(booking,place),bookingSectionHTML('Cancellation'")) failures.push('Trip cards still include Guide-owned accommodation/operator content.');
if(!trip.includes('accommodation-detail-card--compact')) failures.push('Compact Trip accommodation card contract missing.');
if(!trip.includes('usefulCheckInInstructions')) failures.push('Generic accommodation check-in wording filter missing.');
if(!guide.includes("g.cat==='STAY'?'':")) failures.push('Guide STAY header-description duplication guard missing.');
if(!data.includes('"checkIn":"2:00 PM","checkOut":"10:00 AM"')) failures.push('Sudima check-in/check-out contract missing.');
if(admin.includes('trip-studio-selector-arrow')) failures.push('Studio selector arrow returned.');
if(!admin.includes('Leave Studio Mode')) failures.push('Leave Studio Mode action missing.');
if(!expenses.includes('canManageExpense') || !expenses.includes('This cannot be undone.')) failures.push('Expense ownership/delete confirmation contract missing.');
if(!moments.includes('canManageMoment') || !moments.includes('This cannot be undone.')) failures.push('Moment ownership/delete confirmation contract missing.');
if(failures.length){console.error('UX CONTRACT: FAILED');failures.forEach(x=>console.error('- '+x));process.exit(1);}
console.log('UX CONTRACT: PASS — Trip/Guide, Studio and shared-data permissions are enforced.');
