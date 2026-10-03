const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('sw.js','utf8');
const a=src.indexOf('function looksLikeHtmlDocument');
const b=src.indexOf('\nasync function fetchValidHtml',a);
assert(a>=0&&b>a,'SW identity helpers missing');
const code=src.slice(a,b);
const ctx={URL,Response,self:{location:{origin:'https://trip.test'}}};vm.createContext(ctx);vm.runInContext(code+';this.validateHtmlResponse=validateHtmlResponse;this.expectedPageTitle=expectedPageTitle;',ctx);
(async()=>{
 const day='<!doctype html><html><head><title data-trip-page-title="Day">Day</title></head></html>';
 const home='<!doctype html><html><head><title data-trip-page-title="Home">Home</title></head></html>';
 const portal='<!doctype html><html><head><title>Wi-Fi Login</title></head></html>';
 assert.equal(ctx.expectedPageTitle('https://trip.test/day.html?day=1'),'Day');
 assert(await ctx.validateHtmlResponse(new Response(day,{headers:{'content-type':'text/html'}}),'Day'));
 assert(!(await ctx.validateHtmlResponse(new Response(home,{headers:{'content-type':'text/html'}}),'Day')),'Home bytes must not poison Day');
 assert(!(await ctx.validateHtmlResponse(new Response(portal,{headers:{'content-type':'text/html'}}),'Moments')),'portal HTML must be rejected');
 assert(!(await ctx.validateHtmlResponse(new Response(day,{headers:{'content-type':'application/json'}}),'Day')),'wrong MIME must be rejected');
 console.log('CF3 SW ROUTE IDENTITY: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
