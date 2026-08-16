#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const css=read('styles.css'),moods=read('moments-compat.js');
const data=read('data.js'),day=read('day.html'),expenses=read('expenses.js'),cfg=read('trip-config.js');
const core=read('core-runtime.js'),storage=read('storage-config.js'),currency=read('currency-runtime.js'),release=JSON.parse(read('RELEASE.json')),expHtml=read('expenses.html'),guide=read('guide-runtime.js'),tripRuntime=read('trip-runtime.js');

// Presentation modules / moods
assert(css.includes('linear-gradient(145deg,#e7c7cf'),'Moments gradient missing');
assert(css.includes('linear-gradient(145deg,#a9c7a1'),'Expenses gradient missing');
assert(css.includes('repeat(2,minmax(0,1fr))'),'Split By 2x2 contract missing');
['正到爆','估你唔到','仆街了'].forEach(x=>assert(moods.includes(x),'Mixed-language mood missing: '+x));
assert(css.includes('--rc10-expense')&&css.includes('--rc10-moment'),'module palette missing');
assert(expHtml.includes('expense-title-emoji')&&expHtml.includes('💰'),'Expense modal emoji missing');

// Guide / Trip presentation
assert(guide.includes("Signature / Must Try"),'Restaurant signature section missing');
assert(data.includes('Penthouse setting')&&data.includes('sunset 食到入夜'),'Omakase sunset/penthouse copy missing');
assert(!/Omakase Tiger[\s\S]{0,1800}正式營業時間出發前再確認/.test(data),'Omakase still asks to reconfirm generic trading hours');
assert(cfg.includes('tripMenuGroups')&&cfg.includes('activities-transport'),'VN trip menu grouping config missing');
assert(tripRuntime.includes('openTripModuleGroup')&&tripRuntime.includes('groupedModules'),'Generic trip module grouping runtime missing');

// Generic presentation / expense defaults retained from earlier presentation contracts
assert(day.includes('<strong>To next stop</strong>'),'Timeline instruction must use To next stop');
assert(!day.includes('<strong>Next leg</strong>'),'Legacy Next leg label remains');
assert(expHtml.includes('placeholder="e.g. Dinner"')&&!expHtml.includes('Fergburger'),'Expense placeholder must remain trip-neutral');
assert(!expHtml.includes('Choose the currency actually charged'),'Redundant currency instruction remains');
assert(expenses.includes('expenseCurrency=MONEY.getTripCurrency().code;'),'New expense must default to destination currency');
assert(css.includes('data-party-presentation="emoji"'),'Emoji-only party presentation CSS missing');
assert(read('party-render-runtime.js').includes('dataset.partyPresentation'),'Party presentation runtime contract missing');
assert(expenses.includes('basis=100000')&&expenses.includes('basisConverted'),'Expense FX basis display contract missing');

// Sync/content
assert(/expense-title-emoji[^>]*[^]*?💰[^]*?Add expense/.test(expenses),'Add expense reset must preserve money-bag emoji');
assert(/replace\(\/To next stop/.test(day),'Timeline renderer must strip duplicated To next stop prefix');
const transfer=data.match(/"bk-transfer-in": \{[\s\S]*?\n  \}/)?.[0]||'';
assert(/"status": "pending"/.test(transfer),'Arrival transfer must remain pending');
assert(/"bookingMethod": "Klook online booking"/.test(transfer),'Arrival transfer must expose the intended online booking channel without pretending it is booked');
assert(/"bookingUrl": "https:\/\/www\.klook\.com\//.test(transfer),'Arrival transfer online method must have a real booking URL');
assert(/"status": "pending"/.test(transfer),'Arrival transfer must remain pending until actually booked');
assert(/未訂|未預約/.test(transfer),'Arrival transfer handoff must explicitly remain not booked');

// Traveller identity / home UI
assert(/version:'RC\d+(?:\.\d+)?-25\.\d+\.\d+(?:\.\d+)?'/.test(cfg),'Release build identity missing');
assert(/identityStorageKey:'ccmv-vietnam-2026:traveller_identity:v1'/.test(cfg),'identity storage must be trip-scoped');
assert(/function ensureFriendIdentity\(\)/.test(core),'first-device identity gate missing');
assert(/getStoredFriend\(\)/.test(core),'stored identity resolver missing');
assert(/identitySelectionRequired/.test(core),'required identity state missing');
assert(/mama-modal\.identity-required \.mama-close\{display:none/.test(css),'required selector must not be dismissible');
assert(/friend-pill \.family-name\{display:inline/.test(css),'header identity pill must show traveller name');
assert(/linear-gradient\(150deg,#fbf5e9/.test(css),'premium home hero treatment missing');
assert(/home-trip-line span[\s\S]*border-radius:15px/.test(css),'rounded trip metadata chips missing');
assert(cfg.includes('"presentation":"emoji-name"'),'party presentation must be emoji-name');
assert(core.includes("closeBtn.hidden=true")&&core.includes("closeBtn.style.display='none'"),'required traveller close must be DOM-disabled');
assert(css.includes('.friend-pill .family-name{display:inline!important'),'header traveller name contract missing');

// Expense / timeline browser-facing behaviour
assert(css.includes('#expenseModal .custom-split-row{display:grid!important;grid-template-columns:1fr!important'),'mobile custom split full-name layout missing');
assert(expenses.includes('const other=code===home?trip:home')&&expenses.includes('${FORMATTER.decimal(basis,0)} ${code} ≈ ${FORMATTER.decimal(basisConverted,2)} ${other}'),'bidirectional input-currency FX rate missing');
assert(day.includes("String(booking.status||booking.displayStatus||'pending')"),'timeline booking status must resolve canonical status first');
assert(storage.includes("bookingOverrides:namespace+':booking_overrides:v2'"),'booking overrides must be trip namespaced');
assert(!css.includes('\\n\\n/* Engine 25.3.9'),'escaped-newline CSS corruption still present');

// Cache + visual release contract
const token=release.asset_cache_token; assert(token,'Release asset_cache_token missing');
assert(/version:'RC\d+(?:\.\d+)?-25\.6\.2'/.test(cfg),'Trip version missing');
for(const f of ['index.html','expenses.html','day.html','guide.html','moments.html','trip.html']){
  const h=read(f); assert(h.includes(`?v=${token}`),f+' missing current release cache token');
  assert(!/\?v=(rc25|stage3|nz1|engine-booking)/.test(h),f+' has stale cache token');
}
assert(css.includes('Traveller emoji is presentation, never a badge/chip.'));
assert(/grid-template-columns:(?:62|64)px minmax\(0,1fr\)!important/.test(css));
assert(currency.includes('1 ${state.quote} ≈ ${FORMATTER.decimal(inverse,0)} ${state.base}'));

// Moments + timeline capability
assert(!data.includes('"time": "Optional · 晚餐後"'),'Optional supper time still duplicates context');
assert(!data.includes('"title": "🌙 Optional · 酒店宵夜"'),'Optional supper title still duplicates Optional');
assert(day.includes('route-hint route-hint--delivery'),'Delivery route must not render as To next stop');
assert(css.includes('grid-template-columns:64px minmax(0,1fr)!important'),'Mobile timeline safe rail missing');
assert(css.includes('linear-gradient(160deg,#f7e3e7'),'Soft Moments mobile palette missing');
for(const file of fs.readdirSync(root).filter(x=>x.endsWith('.html'))){
  const html=read(file); if(html.includes('<script')||html.includes('<link')) assert(html.includes('?v='+token),`${file}: stale asset token`);
}
console.log('PRESENTATION / IDENTITY / CACHE / TIMELINE CAPABILITY: PASS');
