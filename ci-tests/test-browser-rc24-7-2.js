#!/usr/bin/env node
'use strict';
const {chromium}=require('playwright');
const base=process.env.RC2472_BASE_URL||'http://127.0.0.1:4177';
const pairs=[
 ['southwark-booking','southwark','Southwark Hotel & Apartments'],['peppers-booking','peppers','Peppers Bluewater Resort'],
 ['edgewater-booking','edgewater','Edgewater'],['sudima-booking','sudima-five-mile','Sudima Queenstown Five Mile'],
 ['queenstown-booking','queenstown-house','Queenstown Airbnb · Tonic Lodge'],['lakefront-booking','lakefront-lodge','Lakefront Lodge']
];
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.RC247_BROWSER_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
 const errors=[],responsive=[],links=[];
 for(const width of [320,375,430,1280]){
  const page=await browser.newPage({viewport:{width,height:900}});
  page.on('pageerror',e=>errors.push(`${width}: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error'&&!/favicon|supabase|network|404 \(File not found\)/i.test(m.text()))errors.push(`${width}: ${m.text()}`);});
  await page.goto(`${base}/trip.html?bookingId=southwark-booking`,{waitUntil:'networkidle'});await page.waitForTimeout(150);
  const bookingText=await page.locator('#tripModalContent').innerText();
  const bookingOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
  await page.goto(`${base}/place.html?id=southwark`,{waitUntil:'networkidle'});
  const guideText=await page.locator('#placeMain').innerText();
  const guideOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
  responsive.push({width,bookingOverflow,guideOverflow,compact:/CHECK-IN \/ OUT\n2:00 PM → 10:00 AM/.test(bookingText),southwarkGuide:['STAY · 2:00 PM → 10:00 AM','PARKING · Confirmed · NZD 15 · pay at hotel','NEARBY · Riverside · 14 min walk','NEARBY · C1 · 6 min walk','NEARBY · PAK’nSAVE Moorhouse · ~5 min drive'].every(x=>guideText.includes(x))});
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:375,height:900}});
 for(const [bookingId,placeId,title] of pairs){
  await page.goto(`${base}/place.html?id=${placeId}`,{waitUntil:'networkidle'});
  const bookingLink=page.locator('.quick-info-actions a').filter({hasText:'Booking'});
  const bookingHref=await bookingLink.getAttribute('href');
  await bookingLink.click();await page.waitForURL(new RegExp(`bookingId=${bookingId}`));await page.waitForTimeout(100);
  const openedBooking=(await page.locator('#tripModalContent').innerText()).includes(title);
  const guideButton=page.getByRole('button',{name:'Guide',exact:true});const guideCount=await guideButton.count();
  if(guideCount===1){await guideButton.click();await page.waitForURL(new RegExp(`place\\.html\\?id=${placeId}`));}
  links.push({bookingId,placeId,bookingHref,openedBooking,guideCount,returnedToGuide:page.url().includes(`id=${placeId}`)});
 }
 await page.goto(`${base}/trip.html`,{waitUntil:'networkidle'});await page.waitForTimeout(700);await page.getByRole('button',{name:'🧳 Trip',exact:true}).click();await page.waitForTimeout(150);await page.getByRole('link',{name:'🏨 Accommodation Bookings & addresses ›',exact:true}).click({force:true});
 const tripText=await page.locator('#tripModalContent').innerText();
 const exportAudit=await page.evaluate(()=>{const view=GenerationSelectionAdapter.view('export');return {bookings:Object.values(view.bookings.byId).filter(x=>x.type==='accommodation').map(x=>x.placeId).sort(),guide:(view.guide.categories.STAY||[]).map(x=>typeof x==='string'?x:x.key).sort(),archway:JSON.stringify(view).toLowerCase().includes('archway')};});
 await page.goto(`${base}/day.html?day=5`,{waitUntil:'networkidle'});const day5=await page.locator('main').innerText();
 const pages={};for(const url of ['index.html','day.html?day=1','day.html?day=2','guide.html','trip.html']){await page.goto(`${base}/${url}`,{waitUntil:'networkidle'});pages[url]=(await page.locator('body').innerText()).trim().length>50;}
 await browser.close();
 const expectedPlaces=pairs.map(x=>x[1]).sort();
 const failed=errors.length||responsive.some(x=>x.bookingOverflow||x.guideOverflow||!x.compact||!x.southwarkGuide)||links.some(x=>x.bookingHref!==`trip.html?bookingId=${x.bookingId}`||!x.openedBooking||x.guideCount!==1||!x.returnedToGuide)||/archway/i.test(tripText)||JSON.stringify(exportAudit.bookings)!==JSON.stringify(expectedPlaces)||JSON.stringify(exportAudit.guide)!==JSON.stringify(expectedPlaces)||exportAudit.archway||!day5.includes('Check in · Queenstown Airbnb · Tonic Lodge')||Object.values(pages).some(x=>!x);
 console.log(JSON.stringify({responsive,links,tripText,exportAudit,day5CheckIn:day5.includes('Check in · Queenstown Airbnb · Tonic Lodge'),pages,errors},null,2));
 if(failed)process.exit(1);
})().catch(error=>{console.error(error);process.exit(1);});
