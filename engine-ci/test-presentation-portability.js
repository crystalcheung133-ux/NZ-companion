const fs=require('fs'),path=require('path');
const targets=[
 'styles.css','theme-config.js','trip-config.js',
 ...fs.readdirSync('starter').filter(x=>x.endsWith('.html')).map(x=>''+x)
];
const forbidden=[
 /\bLee\b/i,/Fowlers/i,/\bYau\b/i,/New Zealand/i,/Queenstown/i,/Christchurch/i,
 /Wanaka/i,/Tekapo/i,/Te Anau/i,/Milford/i,/Arrowtown/i,
 /party[-_ ]?(?:mel|syd|ntl)/i,/location[-_ ]?(?:mel|syd|ntl)/i,/--nz-/i,/--family-(?:mel|syd|ntl)/i,/\b(?:MEL|SYD|NTL)\b/i
];
const bad=[];
for(const file of targets){
 const text=fs.readFileSync(file,'utf8');
 for(const re of forbidden){
   const m=text.match(re);
   if(m) bad.push(`${file}: ${m[0]}`);
 }
}
if(bad.length){console.error(bad.join('\n'));process.exit(1);}
console.log('PRESENTATION PORTABILITY: PASS');
