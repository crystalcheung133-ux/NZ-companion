#!/usr/bin/env node
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const trip=read('trip-config.js'), data=read('data.js'), tripRuntime=read('trip-runtime.js');
const html=read('index.html')+'\n'+read('trip.html');
assert.match(trip,/mode:'collaborative'/,'VN must use collaborative booking mode');
assert.match(trip,/rentalCar:false/,'VN must explicitly disable rental car');
assert.match(trip,/"code": "CRY"/,'Crystal selector code missing');
assert.match(read('party-render-runtime.js'),/User Selection/,'User Selection renderer missing');
assert.match(tripRuntime,/renderTripMenuFromConfig/,'Trip menu must be data-driven');
assert.match(tripRuntime,/openTripCard\('stay'\)/,'Trip runtime must expose Stay');
assert.match(tripRuntime,/openTripCard\('activities'\)/,'Trip runtime must expose Activities');
assert.match(tripRuntime,/openTripCard\('transport'\)/,'Trip runtime must expose Transport');
assert.match(trip,/rentalCar:false/,'VN must disable Rental Car at config level');
assert.match(data,/"netTotalAUD": "AUD 1,478"/,'Fusion net payment missing');
assert.match(data,/"cashbackAmount": "AUD 215"/,'Fusion cashback missing');
assert.doesNotMatch(read('navigation-config.js'),/bookings\.html/,'Standalone Bookings page must not be a navigable Engine route');
assert.doesNotMatch(read('sw.js'),/bookings\.html/,'Standalone Bookings page must not be cached as production UI');
assert.ok(!fs.existsSync(path.join(root,'bookings.html')),'Standalone Bookings page must not exist in the RC6 package');
assert.match(tripRuntime,/openBookingCategoryCard/,'Trip semantic booking categories must open modal cards');
assert.match(tripRuntime,/buildTransportBookingListHTML/,'Transport module runtime missing');

const guideRuntime=read('guide-runtime.js'), partyRuntime=read('party-render-runtime.js');
assert.match(guideRuntime,/RESTAURANTS/,'Dining semantic alias missing');
assert.match(guideRuntime,/EXPERIENCE/,'Activities semantic alias missing');
assert.match(guideRuntime,/list\.length===1/,'Single Stay direct-open missing');
assert.match(partyRuntime,/x\.emoji/,'Participant emoji rendering missing');
assert.doesNotMatch(data,/Little Bear<\/strong><a href='tel:/,'Restaurant leaked into Emergency');
assert.doesNotMatch(data,/Pizza 4P’s Hai Bà Trưng<\/strong><a href='tel:/,'Restaurant leaked into Emergency');
assert.doesNotMatch(data,/Nhà Suga Spa<\/strong><a href='tel:/,'Spa leaked into Emergency');


const dayHtml=read('day.html'), styles=read('styles.css'), money=read('money.js'), asset=read('asset-config.js'), expenses=read('expenses.js');
assert.match(asset,/secondaryMark:'ccmv-logo-calibrated\.png'/,'VN header must use the complete uncropped VN logo asset');
assert.match(dayHtml,/returnToBookingDetail/,'Timeline Booking action must use generic booking routing');
assert.match(dayHtml,/isTimelineRenderable/,'Timeline transport transition filter missing');
assert.match(dayHtml,/current<lastDayNumber/,'VN timeline swipe must use actual day count');
assert.match(styles,/grid-template-columns:58px minmax\(0,1fr\)/,'VN mobile timeline rail was not tightened');
assert.match(styles,/custom-split-row\{grid-template-columns:1fr/,'VN expense custom split mobile fix missing');
assert.match(expenses,/selected\.length===FRIEND_ORDER\.length\?'All'/,'VN expense split summary must support four travellers');
assert.match(money,/live-fallback/,'VND currency converter fallback missing');

console.log('VN REFERENCE INTEGRATION: PASS — split Trip modules, modal booking UX, booking price/net, dual currency, no rental car, collaborative mode.');
