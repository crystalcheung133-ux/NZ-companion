#!/usr/bin/env node
'use strict';
const {chromium}=require('playwright');
const base=process.env.RC2471_BASE_URL||'http://127.0.0.1:4175';
const relationships=[
  ['southwark-booking','southwark','Southwark Hotel & Apartments'],
  ['peppers-booking','peppers','Peppers Bluewater Resort'],
  ['archway-booking','archway','Archway Motels & Chalets'],
  ['queenstown-booking','queenstown-house','Queenstown House Boutique B&B and Apartments'],
  ['lakefront-booking','lakefront-lodge','Lakefront Lodge Te Anau'],
  ['edgewater-booking','edgewater','Edgewater Hotel'],
  ['luxe-milford-booking','milford','Milford Sound']
];
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.RC247_BROWSER_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
  const responsive=[];const appErrors=[];
  for(const width of [320,375,430,1280]){
    const page=await browser.newPage({viewport:{width,height:900}});
    page.on('pageerror',error=>appErrors.push(`${width}: ${error.message}`));
    page.on('console',message=>{if(message.type()==='error'&&!/favicon|supabase|network|404 \(File not found\)/i.test(message.text()))appErrors.push(`${width}: ${message.text()}`);});
    await page.goto(`${base}/trip.html?bookingId=southwark-booking`,{waitUntil:'networkidle'});await page.waitForTimeout(250);
    const bookingText=await page.locator('#tripModalContent').innerText();
    const bookingOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
    await page.goto(`${base}/place.html?id=southwark`,{waitUntil:'networkidle'});
    const guideOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
    responsive.push({width,compactTiming:bookingText.includes('CHECK-IN / OUT\n2:00 PM → 10:00 AM'),repeatedTiming:/Check-in\s*·|Check-out\s*·/i.test(bookingText),bookingOverflow,guideOverflow});
    await page.close();
  }
  const page=await browser.newPage({viewport:{width:375,height:900}});
  const links=[];
  for(const [bookingId,placeId,title] of relationships){
    await page.goto(`${base}/trip.html?bookingId=${bookingId}`,{waitUntil:'networkidle'});await page.waitForTimeout(120);
    const bookingFocused=await page.evaluate(id=>document.activeElement?.id===`booking-detail-${id}`,bookingId);
    const guideHref=await page.locator('.trip-action-btn--guide').getAttribute('href');
    await page.goto(`${base}/place.html?id=${placeId}`,{waitUntil:'networkidle'});await page.waitForTimeout(120);
    const guideFocused=await page.evaluate(id=>document.activeElement?.id===`guide-${id}`,placeId);
    const bookingHref=await page.locator('.quick-info-actions a').filter({hasText:'Booking'}).getAttribute('href');
    links.push({bookingId,placeId,title,bookingFocused,guideFocused,guideHref,bookingHref});
  }
  await page.goto(`${base}/trip.html?bookingId=southwark-booking`,{waitUntil:'networkidle'});await page.waitForTimeout(120);
  const accommodationText=await page.locator('#tripModalContent').innerText();
  await page.reload({waitUntil:'networkidle'});await page.waitForTimeout(120);
  const refreshFocused=await page.evaluate(()=>document.activeElement?.id==='booking-detail-southwark-booking');
  await page.locator('.trip-action-btn--guide').click();await page.waitForURL(/place\.html\?id=southwark/);await page.goBack({waitUntil:'networkidle'});await page.waitForTimeout(120);
  const bookingBack=page.url().includes('bookingId=southwark-booking');
  await page.goto(`${base}/place.html?id=southwark`,{waitUntil:'networkidle'});await page.locator('.quick-info-actions a').filter({hasText:'Booking'}).click();await page.waitForURL(/bookingId=southwark-booking/);await page.goBack({waitUntil:'networkidle'});
  const guideBack=page.url().includes('place.html?id=southwark');
  await page.goto(`${base}/place.html?id=riverside`,{waitUntil:'networkidle'});
  const nonBookableActions=(await page.locator('.quick-info-actions a,.quick-info-actions button').allTextContents()).map(x=>x.trim());
  await page.goto(`${base}/trip.html?bookingId=ultimate-alpine-booking`,{waitUntil:'networkidle'});await page.waitForTimeout(120);
  const unmatchedHasGuide=await page.locator('.trip-action-btn--guide').count()>0;
  await page.goto(`${base}/trip.html?bookingId=invalid-booking`,{waitUntil:'networkidle'});await page.waitForTimeout(120);
  const invalidSafe=!page.url().includes('bookingId=')&&await page.locator('#tripModal.show').count()===0;
  const pages={};for(const url of ['index.html','day.html?day=1','day.html?day=2','guide.html','trip.html','expenses.html','moments.html']){await page.goto(`${base}/${url}`,{waitUntil:'networkidle'});pages[url]=(await page.locator('body').innerText()).trim().length>50;}
  await browser.close();
  const relationshipPass=links.every(x=>x.bookingFocused&&x.guideFocused&&x.guideHref===`place.html?id=${x.placeId}`&&x.bookingHref===`trip.html?bookingId=${x.bookingId}`);
  const responsivePass=responsive.every(x=>x.compactTiming&&!x.repeatedTiming&&!x.bookingOverflow&&!x.guideOverflow);
  const failed=!relationshipPass||!responsivePass||!refreshFocused||!bookingBack||!guideBack||nonBookableActions.join('|')!=='🧭 Navigate'||unmatchedHasGuide||!invalidSafe||appErrors.length||Object.values(pages).some(value=>!value)||!/CASHBACK\nAUD 28\.98/.test(accommodationText)||!/PARKING\nNZD 15 · pre-book/.test(accommodationText);
  console.log(JSON.stringify({responsive,links,refreshFocused,bookingBack,guideBack,nonBookableActions,unmatchedHasGuide,invalidSafe,pages,appErrors},null,2));
  if(failed)process.exit(1);
})().catch(error=>{console.error(error);process.exit(1);});
