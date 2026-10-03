const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('sw.js','utf8');
const a=src.indexOf('function looksLikeHtmlDocument');
const b=src.indexOf('\nasync function cachedValidHtml',a);
assert(a>=0&&b>a,'SW validation/fetch wiring missing');
const code=src.slice(a,b);
let next;
const ctx={URL,Response,Request,self:{location:{origin:'https://trip.test'}},fetch:async()=>next};
vm.createContext(ctx);vm.runInContext(code+';this.expectedPageTitle=expectedPageTitle;this.fetchValidHtml=fetchValidHtml;',ctx);
function response(html,url,type='text/html'){const r=new Response(html,{status:200,headers:{'content-type':type}});Object.defineProperty(r,'url',{value:url});return r;}
(async()=>{
 const moments='<!doctype html><html><head><title data-trip-page-title="Moments">Moments</title></head></html>';
 const days='<!doctype html><html><head><title data-trip-page-title="Days">Days</title></head></html>';
 assert.equal(ctx.expectedPageTitle('https://trip.test/moments.html'),'Moments');
 assert.equal(ctx.expectedPageTitle('https://trip.test/itinerary.html'),'Days');
 next=response(moments,'https://trip.test/moments.html'); assert(await ctx.fetchValidHtml(new Request('https://trip.test/moments.html')),'Moments route must validate online');
 next=response(days,'https://trip.test/itinerary.html'); assert(await ctx.fetchValidHtml(new Request('https://trip.test/itinerary.html')),'Days route must validate online');
 next=response('<!doctype html><html><head><title data-trip-page-title="Home">Home</title></head></html>','https://trip.test/itinerary.html'); assert.equal(await ctx.fetchValidHtml(new Request('https://trip.test/itinerary.html')),null,'Home bytes must not validate as Days');
 console.log('CF4 SW NAVIGATION WIRING: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
