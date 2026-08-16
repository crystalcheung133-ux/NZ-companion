const fs=require('fs'),assert=require('assert');
const htmls=fs.readdirSync('.').filter(n=>n.endsWith('.html'));
let count=0;
for(const name of htmls){
  const h=fs.readFileSync(name,'utf8');
  if(!h.includes('id="guideMenu"'))continue;
  if(h.includes('guide-menu-title')){
    assert(h.includes('guide-menu-icon'),`${name}: guide icon wrapper missing`);
    assert(h.includes('guide-menu-label'),`${name}: guide label wrapper missing`);
    count++;
  }
}
const css=fs.readFileSync('styles.css','utf8');
assert(css.includes('#guideMenu .guide-menu-title'));
assert(css.includes('grid-template-columns:24px 1fr'));
assert(count>=5,'guide menu alignment markup must exist across app pages');
console.log(`GUIDE MENU ALIGNMENT CONTRACT: PASS — ${count} pages`);
