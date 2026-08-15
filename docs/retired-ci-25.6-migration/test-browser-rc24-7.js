#!/usr/bin/env node
'use strict';
const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.RC247_BROWSER_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
  const results=[];
  for(const width of [320,375,430,1280]){
    const page=await browser.newPage({viewport:{width,height:800}});const errors=[];
    page.on('pageerror',e=>errors.push('page: '+e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
    await page.goto('http://127.0.0.1:4173/place.html?id=southwark',{waitUntil:'networkidle'});
    const actions=(await page.locator('.quick-info-actions a,.quick-info-actions button').allTextContents()).map(x=>x.trim());
    const hasSouthwark=(await page.locator('body').innerText()).includes('Southwark Hotel & Apartments');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
    const diagnostic=await page.evaluate(()=>({raw:typeof PLACES!=='undefined'&&!!PLACES.southwark,production:!!GenerationSelectionAdapter.view('guide').places.southwark,title:document.title,main:document.getElementById('placeMain')?.innerText.slice(0,120)}));
    results.push({width,hasSouthwark,actions,overflow,errors,diagnostic});await page.close();
  }
  const page=await browser.newPage({viewport:{width:375,height:800}});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/trip.html?bookingId=southwark-booking',{waitUntil:'networkidle'});await page.waitForTimeout(250);
  const direct=(await page.locator('#tripModalContent').innerText()).includes('2:00 PM → 10:00 AM');
  await page.reload({waitUntil:'networkidle'});await page.waitForTimeout(250);
  const refresh=(await page.locator('#tripModalContent').innerText()).includes('Southwark Hotel & Apartments');
  await page.goto('http://127.0.0.1:4173/trip.html?bookingId=peppers-booking',{waitUntil:'networkidle'});await page.waitForTimeout(250);
  const other=(await page.locator('#tripModalContent').innerText()).includes('Peppers Bluewater Resort');
  await page.goto('http://127.0.0.1:4173/place.html?id=riverside',{waitUntil:'networkidle'});
  const nonBookable=(await page.locator('.quick-info-actions a,.quick-info-actions button').allTextContents()).map(x=>x.trim());
  await page.goto('http://127.0.0.1:4173/place.html?id=southwark',{waitUntil:'networkidle'});
  await page.getByRole('link',{name:/Booking$/}).click();await page.waitForURL(/trip\.html\?bookingId=southwark-booking/);await page.waitForTimeout(250);
  const clickedBooking=(await page.locator('#tripModalContent').innerText()).includes('Southwark Hotel & Apartments');
  await page.goBack({waitUntil:'networkidle'});const backToGuide=page.url().includes('place.html?id=southwark');
  const pages={};for(const url of ['index.html','day.html?day=1','day.html?day=2','guide.html','trip.html','expenses.html','moments.html']){await page.goto('http://127.0.0.1:4173/'+url,{waitUntil:'networkidle'});pages[url]=(await page.locator('body').innerText()).trim().length>50;}
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'networkidle'});await page.reload({waitUntil:'networkidle'});
  await page.context().setOffline(true);await page.reload({waitUntil:'domcontentloaded'});const offlineStartup=(await page.locator('body').innerText()).trim().length>50;await page.context().setOffline(false);
  await browser.close();
  const appErrors=results.flatMap(x=>x.errors).filter(x=>!/(ERR_NETWORK_ACCESS_DENIED|Supabase JS SDK not found|sync failed|404 \(File not found\))/i.test(x));
  const failed=results.some(x=>!x.hasSouthwark||x.overflow||x.actions.join('|')!=='🧭 Navigate|🎟️ Booking')||!direct||!refresh||!other||!clickedBooking||!backToGuide||!offlineStartup||nonBookable.join('|')!=='🧭 Navigate'||errors.length||appErrors.length||Object.values(pages).some(x=>!x);
  console.log(JSON.stringify({responsive:results,deepLink:{direct,refresh,other,clickedBooking,backToGuide},nonBookable,pages,offlineStartup,errors},null,2));
  if(failed)process.exit(1);
})().catch(error=>{console.error(error);process.exit(1);});
