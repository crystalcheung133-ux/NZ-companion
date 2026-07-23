/* Travel Engine V2 — RC21 authoritative Generation Selection Adapter. */
(function(root,factory){
  const engine=root.TravelEngineIntegrity||
    (typeof module==='object'&&module.exports?require('./engine-integrity.js'):null);
  const api=factory(engine,root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.GenerationSelectionAdapter=api;
  if(root.TRAVEL_DATASETS&&root.TRIP_CONFIG)api.rebuild(root.TRAVEL_DATASETS,root.TRIP_CONFIG);
})(typeof globalThis!=='undefined'?globalThis:this,function(engine,root){
  'use strict';

  if(!engine||typeof engine.filterProductionRecords!=='function'){
    throw new Error('Generation Selection Adapter requires the RC20 Travel Engine Integrity API.');
  }

  const STAGE='PROJECTION';
  let current=null;
  let currentSource=null;
  let currentConfig=null;

  function clone(value){
    if(value===undefined)return undefined;
    return JSON.parse(JSON.stringify(value));
  }
  function freeze(value){
    if(value&&typeof value==='object'&&!Object.isFrozen(value)){
      Object.getOwnPropertyNames(value).forEach(key=>freeze(value[key]));
      Object.freeze(value);
    }
    return value;
  }
  function entries(collection){
    if(Array.isArray(collection))return collection.map((record,index)=>[String(record&&record.id||index),record]);
    return collection&&typeof collection==='object'?Object.entries(collection):[];
  }
  function eligible(record){return engine.isProductionEligible(record,'selection');}
  function filteredObject(collection){
    return Object.fromEntries(entries(collection)
      .filter(([,record])=>engine.filterProductionRecords([record],'selection').length===1)
      .map(([id,record])=>[id,clone(record)]));
  }
  function keyOf(entry){return typeof entry==='string'?entry:String(entry&&(entry.key||entry.placeId||entry.id)||'');}
  function duplicateValues(values){
    const seen=new Set(),duplicates=new Set();
    values.forEach(value=>{if(seen.has(value))duplicates.add(value);else seen.add(value);});
    return [...duplicates];
  }
  function sameValue(a,b){return JSON.stringify(a)===JSON.stringify(b);}
  function issue(code,details){
    return Object.assign({
      stage:STAGE,code,severity:'error',entityType:null,entityId:null,field:null,
      relatedEntityId:null,message:'',recommendation:null
    },details||{});
  }
  function allFrozen(value,seen){
    if(!value||typeof value!=='object')return true;
    const visited=seen||new Set();
    if(visited.has(value))return true;
    visited.add(value);
    return Object.isFrozen(value)&&Object.keys(value).every(key=>allFrozen(value[key],visited));
  }
  function itineraryItems(days){
    return entries(days).flatMap(([dayId,day])=>(day&&Array.isArray(day.items)?day.items:[]).map(item=>({dayId,item})));
  }
  function productionDays(sourceDays){
    const output={};
    for(const [dayId,day] of entries(sourceDays)){
      if(!eligible(day))continue;
      const copy=clone(day);
      copy.items=engine.filterProductionRecords(Array.isArray(day.items)?day.items:[],'selection').map(clone);
      output[dayId]=copy;
    }
    return output;
  }
  function filteredGuide(source,places,config){
    const excluded=new Set((config&&config.guide&&config.guide.excludedPlaceIds)||[]);
    const allowed=id=>Boolean(id&&places[id]&&!excluded.has(id));
    const order=(source.GUIDE_ORDER||source.guideOrder||[]).map(keyOf).filter(allowed);
    const categories={};
    for(const [name,list] of entries(source.CATEGORIES||source.categories||{})){
      categories[name]=(Array.isArray(list)?list:[]).map(item=>{
        const id=keyOf(item);
        return id&&allowed(id)?{key:id}:null;
      }).filter(Boolean);
    }
    const dayLinks={};
    for(const [id,links] of entries(source.DAY_LINKS||source.dayLinks||{})){
      if(allowed(id))dayLinks[id]=clone(links);
    }
    return {places,categories,order,dayLinks};
  }
  function navigationActions(source,places,bookings){
    const canonical=source.NAVIGATION_ACTIONS||source.navigationActions;
    if(Array.isArray(canonical)){
      return engine.filterProductionRecords(canonical,'selection').filter(action=>{
        const ownerId=String(action&&action.ownerId||'');
        return !ownerId||Boolean(places[ownerId]||bookings[ownerId]);
      }).map(clone);
    }
    const actions=[];
    for(const [bookingId,booking] of entries(bookings)){
      const navigation=booking&&booking.navigation||{};
      for(const role of ['pickup','return']){
        const destination=navigation[role]||
          booking[`${role}NavigationDestination`]||
          (booking[role]&&booking[role].navigationDestination);
        if(destination)actions.push({
          id:`${bookingId}-${role}`,ownerType:'booking',ownerId:bookingId,
          role:`rental-${role}`,destinationSource:`${role}.navigationDestination`,
          destination:String(destination),
          label:`Navigate to ${role} depot`
        });
      }
    }
    return actions;
  }
  function createProductionProjection(source,config){
    const integrity=engine.acceptTripData(source,config);
    const places=filteredObject(source.PLACES||source.places||{});
    const bookings=filteredObject(source.BOOKINGS_DATA||source.bookings||{});
    const days=productionDays(source.ITINERARY_DATA||source.itinerary||source.days||{});
    const tripCards=filteredObject(source.TRIP_DATA||source.trip||{});
    const tripOrder=(source.TRIP_ORDER||source.tripOrder||Object.keys(tripCards)).map(String).filter(id=>tripCards[id]);
    const guide=filteredGuide(source,places,config||{});
    const navigation=navigationActions(source,places,bookings);
    const projection={
      adapterVersion:'1.0.0',
      release:String(config&&config.version||''),
      sourceRevision:String(source.MASTER_REVISION||source.masterRevision||''),
      guide,
      itinerary:{days},
      trip:{cards:tripCards,order:tripOrder,places},
      bookings:{byId:bookings,order:Object.keys(bookings)},
      navigation:{actions:navigation},
      export:{
        itinerary:clone(days),guide:clone(guide),trip:{cards:clone(tripCards),order:clone(tripOrder)},
        bookings:{byId:clone(bookings),order:Object.keys(bookings)},navigation:{actions:clone(navigation)}
      },
      ai:{
        itinerary:clone(days),guide:clone(guide),trip:{cards:clone(tripCards),order:clone(tripOrder)},
        bookings:{byId:clone(bookings),order:Object.keys(bookings)},navigation:{actions:clone(navigation)}
      },
      acceptance:{
        status:integrity.status,blockingErrorCount:integrity.blockingErrorCount,
        warningCount:integrity.warningCount
      }
    };
    freeze(projection);
    const validation=validateProductionProjection(projection,source,config);
    if(!validation.valid){
      const error=new Error(formatProjectionReport(validation,{format:'text'}));
      error.name='GenerationProjectionError';
      error.validationResult=validation;
      throw error;
    }
    return projection;
  }
  function validateProductionProjection(projection,source,config){
    const errors=[],warnings=[];
    const add=(code,details)=>errors.push(issue(code,details));
    if(!projection||typeof projection!=='object'){
      add('PROJECTION_INCONSISTENT',{entityType:'projection',message:'Production projection is missing or malformed.',recommendation:'Rebuild it through the Generation Selection Adapter.'});
      return {
        valid:false,status:'FAIL',blockingErrorCount:errors.length,warningCount:0,
        errors,warnings,issues:[...errors],stage:STAGE,
        summary:{places:0,itineraryItems:0,bookings:0,tripCards:0,navigationActions:0}
      };
    }
    if(!allFrozen(projection))add('PROJECTION_MUTABLE',{entityType:'projection',field:'immutability',message:'Production projection is not deeply immutable.',recommendation:'Create the view through the adapter and do not thaw or mutate it.'});
    const sourcePlaces=source.PLACES||source.places||{};
    const sourceBookings=source.BOOKINGS_DATA||source.bookings||{};
    const sourceTrip=source.TRIP_DATA||source.trip||{};
    const projectedPlaces=projection.guide&&projection.guide.places||{};
    const projectedBookings=projection.bookings&&projection.bookings.byId||{};
    const projectedTrip=projection.trip&&projection.trip.cards||{};
    const projectedDays=projection.itinerary&&projection.itinerary.days||{};
    function verifyCollection(type,projected,canonical){
      for(const [id,record] of entries(projected)){
        const sourceRecord=canonical[id];
        if(!sourceRecord)add('PROJECTION_SOURCE_MISSING',{entityType:type,entityId:id,field:'id',message:`Projected ${type} has no canonical source.`,recommendation:'Remove the derived record and rebuild from canonical data.'});
        else if(!eligible(sourceRecord)){
          const status=sourceRecord.planningStatus;
          add(status==='cancelled'?'PROJECTION_CANCELLED_VISIBLE':status==='backup'?'PROJECTION_BACKUP_VISIBLE':'PROJECTION_INCONSISTENT',{
            entityType:type,entityId:id,field:'planningStatus',message:`Ineligible ${type} leaked into the production projection.`,
            recommendation:'Correct planning state or rebuild the projection through the adapter.'
          });
        }
      }
      for(const [id,record] of entries(canonical)){
        if(eligible(record)&&!projected[id])add('PROJECTION_INCONSISTENT',{
          entityType:type,entityId:id,field:'selection',message:`Eligible canonical ${type} is absent from production.`,
          recommendation:'Rebuild the projection; do not implement selection in a renderer.'
        });
      }
    }
    verifyCollection('place',projectedPlaces,sourcePlaces);
    verifyCollection('booking',projectedBookings,sourceBookings);
    verifyCollection('trip',projectedTrip,sourceTrip);
    const canonicalItemMap={};
    itineraryItems(source.ITINERARY_DATA||source.itinerary||source.days||{}).forEach(({item})=>{canonicalItemMap[item.id]=item;});
    const projectedItems=itineraryItems(projectedDays).map(({item})=>item);
    duplicateValues(projectedItems.map(item=>item.id)).forEach(id=>add('PROJECTION_DUPLICATE',{entityType:'itineraryItem',entityId:id,field:'id',message:'Duplicate production itinerary item.',recommendation:'Correct the canonical duplicate and rebuild.'}));
    verifyCollection('itineraryItem',Object.fromEntries(projectedItems.map(item=>[item.id,item])),canonicalItemMap);
    for(const id of duplicateValues((projection.guide&&projection.guide.order||[])))add('PROJECTION_DUPLICATE',{entityType:'guideEntry',entityId:id,field:'order',message:'Duplicate production Guide entry.',recommendation:'Correct canonical Guide ordering and rebuild.'});
    for(const id of duplicateValues((projection.bookings&&projection.bookings.order||[])))add('PROJECTION_DUPLICATE',{entityType:'booking',entityId:id,field:'order',message:'Duplicate production booking entry.',recommendation:'Correct canonical booking IDs and rebuild.'});
    for(const action of (projection.navigation&&projection.navigation.actions||[])){
      if(action.ownerId&&!projectedPlaces[action.ownerId]&&!projectedBookings[action.ownerId]){
        add('PROJECTION_SOURCE_MISSING',{entityType:'navigationAction',entityId:action.id,field:'ownerId',relatedEntityId:action.ownerId,message:'Production navigation owner is not a production entity.',recommendation:'Bind the canonical action to an eligible owner or exclude it.'});
      }
    }
    if(!projection.export||!sameValue(projection.export.itinerary,projectedDays)||!sameValue(projection.export.bookings,projection.bookings)){
      add('PROJECTION_INCONSISTENT',{entityType:'export',field:'productionView',message:'Export view differs from the production itinerary or bookings.',recommendation:'Rebuild all consumer views through the single adapter.'});
    }
    if(!projection.ai||!sameValue(projection.ai.itinerary,projectedDays)){
      add('PROJECTION_INCONSISTENT',{entityType:'ai',field:'itinerary',message:'AI view differs from the production itinerary.',recommendation:'Expose only the adapter-produced AI view.'});
    }
    return result();
    function result(){
      return {
        valid:errors.length===0,status:errors.length?'FAIL':'PASS',
        blockingErrorCount:errors.length,warningCount:warnings.length,
        errors,warnings,issues:[...errors,...warnings],
        stage:STAGE,
        summary:{
          places:Object.keys(projectedPlaces||{}).length,
          itineraryItems:projectedItems?projectedItems.length:0,
          bookings:Object.keys(projectedBookings||{}).length,
          tripCards:Object.keys(projectedTrip||{}).length,
          navigationActions:projection&&projection.navigation&&projection.navigation.actions?projection.navigation.actions.length:0
        }
      };
    }
  }
  function formatProjectionReport(result,options){
    const markdown=!options||options.format!=='text';
    const lines=markdown?['# Generation Projection Failure Report','',`## ${result.status}`,'']:[`GENERATION PROJECTION ${result.status}`,''];
    lines.push(`Blocking errors: ${result.blockingErrorCount}`,`Warnings: ${result.warningCount}`,'');
    result.issues.forEach(item=>{
      lines.push(markdown?`## FAIL ${item.code}`:`FAIL ${item.code}`,'',`Stage: ${item.stage}`);
      if(item.entityType)lines.push(`Entity: ${item.entityType}${item.entityId?` / ${item.entityId}`:''}`);
      if(item.field)lines.push(`Field: ${item.field}`);
      lines.push(`Message: ${item.message}`);
      if(item.recommendation)lines.push(`Recommended correction: ${item.recommendation}`);
      lines.push('');
    });
    if(!result.issues.length)lines.push('No validation issues.');
    return lines.join('\n').trim()+'\n';
  }
  function rebuild(source,config){
    currentSource=source;
    currentConfig=config;
    current=createProductionProjection(source,config);
    root.PRODUCTION_PROJECTION=current;
    if(root.document&&typeof root.CustomEvent==='function'){
      root.document.dispatchEvent(new root.CustomEvent('travelengine:productionprojectionchange',{detail:{projection:current}}));
    }
    return current;
  }
  function getCurrent(){
    if(!current&&root.TRAVEL_DATASETS&&root.TRIP_CONFIG)rebuild(root.TRAVEL_DATASETS,root.TRIP_CONFIG);
    return current;
  }
  function requireCurrent(){
    const projection=getCurrent();
    if(!projection)throw new Error('Production projection has not been built.');
    return projection;
  }
  function view(name){return requireCurrent()[name];}
  function promoteAndRebuild(change){
    if(!currentSource)throw new Error('No canonical planning dataset is registered.');
    const promotion=engine.promotePlanningRecord(currentSource,change,currentConfig);
    if(promotion.accepted)rebuild(promotion.data,currentConfig);
    return Object.assign({},promotion,{projection:promotion.accepted?current:null});
  }

  return Object.freeze({
    version:'1.0.0-generation-selection',
    createProductionProjection,validateProductionProjection,formatProjectionReport,
    rebuild,getCurrent,requireCurrent,view,promoteAndRebuild
  });
});
