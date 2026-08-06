/* guide-navigation-runtime.js — single owner for Guide ordering and navigation. */
(function(root){
  'use strict';
  function source(){return root.GenerationSelectionAdapter?root.GenerationSelectionAdapter.view('guide'):null;}
  function excluded(){return new Set((root.TRIP_CONFIG&&root.TRIP_CONFIG.guide&&root.TRIP_CONFIG.guide.excludedPlaceIds)||[]);}
  function keyOf(item){return typeof item==='string'?item:item&&item.key;}
  function categoryFor(key){
    const guide=source(); if(!guide)return '';
    const categories=guide.categories||{};
    const preferred=['ATTRACTIONS','ACTIVITIES','DINING','STAY','SHOP','TRANSPORT'];
    const ordered=preferred.concat(Object.keys(categories).filter(function(cat){return !preferred.includes(cat);}));
    return ordered.find(function(cat){return (categories[cat]||[]).some(function(item){return keyOf(item)===key;});})||'';
  }
  function dayNumber(key){
    const guide=source(); const links=(guide&&guide.dayLinks&&guide.dayLinks[key])||[];
    const nums=links.map(function(link){const m=String(link&&link[0]||'').match(/Day\s*(\d+)/i);return m?Number(m[1]):null;}).filter(Number.isFinite);
    return nums.length?Math.min.apply(Math,nums):999;
  }
  function activityGroup(item){
    const text=((item&&item.title)||'')+' '+((item&&item.sub)||'')+' '+((item&&item.categoryLabel)||'');
    const lower=text.toLowerCase();
    if(/cruise|tour|4wd|glowworm|milford|gold panning/.test(lower))return 'Tours & Cruises';
    if(/track|hike|walk|blue lakes|deer park/.test(lower))return 'Walks & Outdoor';
    return 'Experiences & Attractions';
  }
  function categoryKeys(category){
    const guide=source(); if(!guide)return [];
    const skip=excluded();
    const explicit=(guide.categories&&guide.categories[category]||[]).map(function(item){return keyOf(item);}).filter(Boolean);
    const inferred=Object.keys(guide.places||{}).filter(function(key){return String((guide.places[key]||{}).cat||'')===String(category);});
    const keys=explicit.concat(inferred.filter(function(key){return !explicit.includes(key);}));
    const items=keys.map(function(key){return key&&guide.places[key]?Object.assign({key:key},guide.places[key]):null;}).filter(function(item){return item&&!skip.has(item.key);});
    if(category==='ATTRACTIONS')items.sort(function(a,b){return dayNumber(a.key)-dayNumber(b.key)||String(a.title||'').localeCompare(String(b.title||''));});
    else if(category==='ACTIVITIES')items.sort(function(a,b){return activityGroup(a).localeCompare(activityGroup(b))||String(a.title||'').localeCompare(String(b.title||''));});
    else items.sort(function(a,b){return String(a.title||'').localeCompare(String(b.title||''));});
    return items.map(function(item){return item.key;});
  }
  function sequenceFor(key){
    const guide=source(); if(!guide)return [];
    const category=categoryFor(key)||(guide.places[key]||{}).cat;
    const local=categoryKeys(category);
    if(local.length>1)return local;
    const skip=excluded();
    return (guide.order||[]).filter(function(itemKey){return guide.places[itemKey]&&!skip.has(itemKey);});
  }
  function neighbours(key){
    const seq=sequenceFor(key); const index=seq.indexOf(key);
    if(index<0)return {previous:null,next:null,position:0,total:seq.length,sequence:seq};
    return {previous:index>0?seq[index-1]:null,next:index<seq.length-1?seq[index+1]:null,position:index+1,total:seq.length,sequence:seq};
  }
  function dayLinks(key){const guide=source();return (guide&&guide.dayLinks&&guide.dayLinks[key])||[];}
  root.GUIDE_NAVIGATION=Object.freeze({categoryFor:categoryFor,categoryKeys:categoryKeys,sequenceFor:sequenceFor,neighbours:neighbours,dayLinks:dayLinks,dayNumber:dayNumber,activityGroup:activityGroup});
})(globalThis);
