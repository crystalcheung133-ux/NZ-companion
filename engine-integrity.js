/* Travel Engine V2 — authoritative Engine Integrity Layer E1–E5. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.TravelEngineIntegrity=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const INTEGRITY_STAGES=Object.freeze(['E1','E2','E3','E4','E5']);
  const STAGES=Object.freeze([...INTEGRITY_STAGES,'PLANNING']);
  const PLANNING_STATUSES=Object.freeze(['confirmed','planned','backup','optional','cancelled']);
  const PLANNING_ROLES=Object.freeze(['primary','alternative']);
  const NON_PLACE_ROLES=Object.freeze([
    'meal-choice','accommodation-meal','operator-meal','fuel-check','final-refuel',
    'comfort-stop','free-time','check-in','check-out','preparation','transfer-instruction'
  ]);
  const NAVIGATION_ROLES=Object.freeze([
    'place','hotel','rental-pickup','rental-return','airport','activity-meeting-point',
    'restaurant','parking','shuttle-collection-point'
  ]);
  const PRESENTATION_FIELDS=new Set([
    'title','name','label','subtitle','sub','emoji','description','desc','address','maps','map'
  ]);
  const PLACE_ACTION_FIELDS=['map','maps','address','navigation','navigationAction','navigationDestination'];

  function value(data,...keys){
    for(const key of keys)if(data&&data[key]!=null)return data[key];
    return undefined;
  }
  function text(input){return typeof input==='string'?input.trim():'';}
  function recordEntries(collection){
    if(Array.isArray(collection))return collection.map((record,index)=>[record&&record.id!=null?record.id:String(index),record]);
    if(collection&&typeof collection==='object')return Object.entries(collection);
    return [];
  }
  function recordMap(collection){
    const map=new Map();
    for(const [key,record] of recordEntries(collection)){
      const id=text(record&&record.id)||text(key);
      if(id&&!map.has(id))map.set(id,record);
    }
    return map;
  }
  function itineraryDays(data){return value(data,'ITINERARY_DATA','itinerary','days')||{};}
  function itineraryItems(data){
    const output=[];
    for(const [dayKey,day] of recordEntries(itineraryDays(data))){
      for(const item of (day&&Array.isArray(day.items)?day.items:[]))output.push({dayKey,day,item});
    }
    return output;
  }
  function issue(stage,code,severity,details){
    return Object.assign({
      stage,code,severity,
      entityType:null,entityId:null,field:null,relatedEntityId:null,
      message:'',recommendation:null
    },details||{});
  }
  function collector(stage){
    const errors=[],warnings=[];
    return {
      error(code,details){errors.push(issue(stage,code,'error',details));},
      warn(code,details){warnings.push(issue(stage,code,'warning',details));},
      result(summary){return {stage,valid:errors.length===0,errors,warnings,summary:summary||{}};}
    };
  }
  function validId(id){
    return typeof id==='string'&&id.length>0&&id===id.trim()&&
      /^[A-Za-z0-9]+(?:[-_.:][A-Za-z0-9]+)*$/.test(id)&&
      !/^(?:temp|temporary|placeholder|todo|tbd|test|sample|dummy|fixme)(?:[-_.:]|$)/i.test(id);
  }
  function idMessage(entityType,id){
    return {
      entityType,entityId:typeof id==='string'?id:null,field:'id',
      message:`${entityType} ID must be a stable, non-empty, trimmed, non-placeholder string.`,
      recommendation:'Replace the malformed ID with a stable canonical identifier and update its references.'
    };
  }
  function duplicateIds(entries){
    const seen=new Set(),duplicates=new Set();
    for(const [key,record] of entries){
      const id=text(record&&record.id)||text(key);
      if(seen.has(id))duplicates.add(id);else seen.add(id);
    }
    return [...duplicates];
  }
  function validateRecords(c,collection,entityType){
    const entries=recordEntries(collection);
    for(const id of duplicateIds(entries))c.error(`ENTITY_${entityType.toUpperCase()}_ID_DUPLICATE`,{
      entityType,entityId:id,field:'id',message:`Duplicate ${entityType} ID: ${id}.`,
      recommendation:'Keep one canonical record and update references without renumbering unrelated entities.'
    });
    for(const [key,record] of entries){
      const id=record&&record.id!=null?record.id:key;
      if(!record||typeof record!=='object'||Array.isArray(record)){
        c.error('ENTITY_RECORD_MALFORMED',{entityType,entityId:text(id)||null,message:`${entityType} record must be an object.`});
        continue;
      }
      if(!validId(id))c.error('ENTITY_ID_MALFORMED',idMessage(entityType,id));
      if(!Array.isArray(collection)&&record.id!=null&&text(record.id)!==text(key)){
        c.error('ENTITY_ID_KEY_MISMATCH',{
          entityType,entityId:text(record.id)||null,field:'id',relatedEntityId:text(key)||null,
          message:`${entityType} record ID does not match its canonical collection key.`,
          recommendation:'Use the collection key as the record ID or correct the key and every canonical reference.'
        });
      }
    }
    return entries.length;
  }
  function sourceIds(data,name,collection){
    const meta=value(data,'SOURCE_META','sourceMeta')||{};
    const explicit=meta[name];
    if(Array.isArray(explicit))return explicit;
    return recordEntries(collection).map(([key,record])=>text(record&&record.id)||text(key));
  }
  function validateSourceDuplicates(c,ids,entityType){
    const seen=new Set();
    for(const id of ids){
      if(seen.has(id))c.error(`ENTITY_${entityType.toUpperCase()}_ID_DUPLICATE`,{
        entityType,entityId:id,field:'id',message:`Duplicate ${entityType} ID: ${id}.`,
        recommendation:'Remove the duplicate canonical definition; do not renumber unrelated records.'
      });
      seen.add(id);
    }
  }

  function validateE1(data,config){
    const c=collector('E1');
    const places=value(data,'PLACES','places')||{};
    const bookings=value(data,'BOOKINGS_DATA','bookings')||{};
    const days=itineraryDays(data);
    const placeCount=validateRecords(c,places,'place');
    const bookingCount=validateRecords(c,bookings,'booking');
    validateSourceDuplicates(c,sourceIds(data,'placeIds',places),'place');
    validateSourceDuplicates(c,sourceIds(data,'bookingIds',bookings),'booking');
    const itemEntries=itineraryItems(data).map(({item},index)=>[item&&item.id!=null?item.id:String(index),item]);
    validateRecords(c,itemEntries.map(([,record])=>record),'itineraryItem');
    validateSourceDuplicates(c,sourceIds(data,'itineraryItemIds',itemEntries.map(([,record])=>record)),'itineraryItem');
    for(const [dayKey,day] of recordEntries(days)){
      if(!day||typeof day!=='object'||Array.isArray(day)){
        c.error('ENTITY_DAY_MALFORMED',{entityType:'itineraryDay',entityId:text(dayKey)||null,message:'Itinerary day must be an object.'});
        continue;
      }
      if(!Array.isArray(day.items))c.error('ENTITY_DAY_ITEMS_MALFORMED',{
        entityType:'itineraryDay',entityId:text(dayKey)||null,field:'items',message:'Itinerary day items must be an array.'
      });
    }
    const guideOrder=value(data,'GUIDE_ORDER','guideOrder')||[];
    if(!Array.isArray(guideOrder))c.error('ENTITY_GUIDE_ORDER_MALFORMED',{entityType:'guideOrder',field:'GUIDE_ORDER',message:'Guide order must be an array.'});
    const categories=value(data,'CATEGORIES','categories')||{};
    if(!categories||typeof categories!=='object'||Array.isArray(categories))c.error('ENTITY_GUIDE_CATEGORIES_MALFORMED',{entityType:'guideCategory',field:'CATEGORIES',message:'Guide categories must be an object.'});
    const tripConfig=config||value(data,'TRIP_CONFIG','tripConfig')||{};
    for(const field of ['tripName','startDate','endDate','version']){
      if(!text(tripConfig[field]))c.error('ENTITY_TRIP_CONFIG_REQUIRED',{
        entityType:'tripConfig',entityId:'trip',field,message:`Trip configuration requires ${field}.`,
        recommendation:`Supply the canonical ${field}; validation will not fabricate it.`
      });
    }
    const references=value(data,'CANONICAL_REFERENCES','canonicalReferences')||[];
    const maps={place:recordMap(places),booking:recordMap(bookings),itineraryItem:recordMap(itemEntries.map(([,item])=>item))};
    for(const reference of references){
      const target=maps[reference&&reference.entityType];
      if(!target||!target.has(text(reference&&reference.entityId)))c.error('ENTITY_CANONICAL_REFERENCE_UNRESOLVED',{
        entityType:reference&&reference.entityType||'unknown',entityId:text(reference&&reference.entityId)||null,
        field:reference&&reference.field||null,message:'Canonical entity reference does not resolve.',
        recommendation:'Correct the reference to an existing canonical ID or create the real canonical entity from authoritative data.'
      });
    }
    return c.result({places:placeCount,itineraryDays:recordEntries(days).length,itineraryItems:itemEntries.length,bookings:bookingCount});
  }

  function guideKey(entry){return typeof entry==='string'?entry:text(entry&&(entry.key||entry.placeId||entry.id));}
  function validateE2(data){
    const c=collector('E2');
    const places=recordMap(value(data,'PLACES','places')||{});
    const bookings=recordMap(value(data,'BOOKINGS_DATA','bookings')||{});
    const guideOrder=value(data,'GUIDE_ORDER','guideOrder')||[];
    const categories=value(data,'CATEGORIES','categories')||{};
    const orderKeys=[];
    for(const entry of Array.isArray(guideOrder)?guideOrder:[]){
      const key=guideKey(entry);orderKeys.push(key);
      if(!places.has(key))c.error('REL_GUIDE_ORDER_PLACE_MISSING',{
        entityType:'guideOrder',entityId:key||null,field:'placeId',relatedEntityId:key||null,
        message:'Guide order entry does not resolve to a canonical place.',
        recommendation:'Correct or remove the relationship; do not create a fake place.'
      });
    }
    const categoryKeys=[];
    for(const [category,entries] of recordEntries(categories)){
      if(!Array.isArray(entries)){
        c.error('REL_GUIDE_CATEGORY_MALFORMED',{entityType:'guideCategory',entityId:category,field:'entries',message:'Guide category entries must be an array.'});
        continue;
      }
      for(const entry of entries){
        const key=guideKey(entry);categoryKeys.push(key);
        if(!places.has(key))c.error('REL_GUIDE_CATEGORY_PLACE_MISSING',{
          entityType:'guideCategory',entityId:category,field:'placeId',relatedEntityId:key||null,
          message:'Guide category entry does not resolve to a canonical place.',
          recommendation:'Correct or remove the relationship; do not create a fake place.'
        });
        if(entry&&typeof entry==='object'&&Object.keys(entry).some(field=>PRESENTATION_FIELDS.has(field))){
          c.error('REL_GUIDE_PRESENTATION_AUTHORITY_DUPLICATED',{
            entityType:'guideCategory',entityId:category,field:'entries',relatedEntityId:key||null,
            message:'Guide entry copies canonical place presentation content.',
            recommendation:'Store only the canonical place key and render presentation from the place record.'
          });
        }
      }
    }
    for(const key of orderKeys)if(key&&!categoryKeys.includes(key))c.error('REL_GUIDE_PLACE_UNREACHABLE',{
      entityType:'place',entityId:key,field:'GUIDE_ORDER',message:'Intended Guide place is not reachable through a Guide category.',
      recommendation:'Add the canonical place key to the appropriate Guide category or remove it from intended Guide ordering.'
    });
    for(const key of categoryKeys)if(key&&!orderKeys.includes(key))c.error('REL_GUIDE_ENTRY_ORPHAN',{
      entityType:'place',entityId:key,field:'CATEGORIES',message:'Guide category place is absent from Guide ordering.',
      recommendation:'Add the canonical place key to Guide ordering or remove the obsolete category relationship.'
    });
    const dayLinks=value(data,'DAY_LINKS','dayLinks')||{};
    for(const key of Object.keys(dayLinks))if(!places.has(key))c.error('REL_DAY_LINK_PLACE_MISSING',{
      entityType:'dayLink',entityId:key,field:'placeId',relatedEntityId:key,
      message:'Day-to-Guide link does not resolve to a canonical place.',
      recommendation:'Remove generic/non-place relationships or correct the key to a real canonical place.'
    });
    let placeLinked=0,nonPlace=0;
    for(const {item} of itineraryItems(data)){
      const id=text(item&&item.id)||null;
      if(item&&item.nonPlace===true){
        nonPlace++;
        if(text(item.placeId))c.error('REL_NON_PLACE_HAS_PLACE',{
          entityType:'itineraryItem',entityId:id,field:'placeId',relatedEntityId:text(item.placeId),
          message:'Explicit non-place item also references a place.',
          recommendation:'Remove the place relationship or correct the classification after authoritative review.'
        });
        if(Array.isArray(item.guideIds)&&item.guideIds.length)c.error('REL_NON_PLACE_HAS_GUIDE',{
          entityType:'itineraryItem',entityId:id,field:'guideIds',message:'Non-place item exposes a Guide relationship.',
          recommendation:'Remove the Guide relationship; generic roles must not create fake Guide places.'
        });
      }else if(text(item&&item.placeId)){
        placeLinked++;
        if(!places.has(text(item.placeId)))c.error('REL_TIMELINE_PLACE_DANGLING',{
          entityType:'itineraryItem',entityId:id,field:'placeId',relatedEntityId:text(item.placeId),
          message:'Timeline item placeId does not resolve.',
          recommendation:'Correct the reference to the authoritative place or explicitly classify a genuine non-place event.'
        });
      }else c.error('REL_TIMELINE_CLASSIFICATION_AMBIGUOUS',{
        entityType:'itineraryItem',entityId:id,field:'placeId',
        message:'Timeline item has neither a place relationship nor explicit non-place classification.',
        recommendation:'Review the event: link a real venue to its canonical place or explicitly mark a genuine non-place role.'
      });
      for(const key of (item&&Array.isArray(item.guideIds)?item.guideIds:[]))if(!places.has(key))c.error('REL_TIMELINE_GUIDE_DANGLING',{
        entityType:'itineraryItem',entityId:id,field:'guideIds',relatedEntityId:key,message:'Timeline Guide relationship does not resolve.'
      });
      if(text(item&&item.bookingId)&&!bookings.has(text(item.bookingId)))c.error('REL_TIMELINE_BOOKING_DANGLING',{
        entityType:'itineraryItem',entityId:id,field:'bookingId',relatedEntityId:text(item.bookingId),message:'Timeline booking relationship does not resolve.'
      });
    }
    for(const [id,booking] of bookings){
      if(text(booking.placeId)&&!places.has(text(booking.placeId)))c.error('REL_BOOKING_PLACE_DANGLING',{
        entityType:'booking',entityId:id,field:'placeId',relatedEntityId:text(booking.placeId),message:'Booking place relationship does not resolve.'
      });
      if(!text(booking.placeId)&&booking.standalone!==true)c.error('REL_BOOKING_OWNER_MISSING',{
        entityType:'booking',entityId:id,field:'placeId',message:'Booking has no related canonical place and is not explicitly standalone.',
        recommendation:'Link the booking to its real canonical entity or mark a genuinely standalone booking.'
      });
    }
    return c.result({placeLinkedTimelineItems:placeLinked,nonPlaceTimelineItems:nonPlace,guideOrder:orderKeys.length,guideCategoryEntries:categoryKeys.length});
  }

  function normalizedDestination(value){return text(value).toLowerCase().replace(/^https?:\/\/(?:www\.)?maps\.google\.com\/\?q=/,'').replace(/[%+\s,./-]+/g,'');}
  function navigationActions(data){
    const explicit=value(data,'NAVIGATION_ACTIONS','navigationActions');
    if(Array.isArray(explicit))return explicit.slice();
    const actions=[];
    for(const [id,booking] of recordEntries(value(data,'BOOKINGS_DATA','bookings')||{})){
      const bookingId=text(booking&&booking.id)||text(id);
      const status=planningStatus(booking);
      const inactiveCandidate=['cancelled','optional','backup'].includes(status)&&!activePlanningFlag(booking);
      if(booking&&!inactiveCandidate&&/^(?:rentalCar|rental-vehicle|rental)$/i.test(booking.type||'')){
        actions.push({id:`${bookingId}:pickup`,ownerType:'booking',ownerId:bookingId,role:'rental-pickup',destinationSource:'pickupNavigationDestination',destination:booking.pickupNavigationDestination,label:'Navigate to pickup depot'});
        actions.push({id:`${bookingId}:return`,ownerType:'booking',ownerId:bookingId,role:'rental-return',destinationSource:'returnNavigationDestination',destination:booking.returnNavigationDestination,label:'Navigate to return depot'});
        if(text(booking.shuttleCollectionNavigationDestination))actions.push({id:`${bookingId}:shuttle`,ownerType:'booking',ownerId:bookingId,role:'shuttle-collection-point',destinationSource:'shuttleCollectionNavigationDestination',destination:booking.shuttleCollectionNavigationDestination,label:'Navigate to shuttle collection point'});
      }
    }
    return actions;
  }
  function validateE3(data){
    const c=collector('E3');
    const actions=navigationActions(data);
    const bookings=recordMap(value(data,'BOOKINGS_DATA','bookings')||{});
    const byOwner=new Map();
    for(const action of actions){
      const id=text(action&&action.id)||null,ownerId=text(action&&action.ownerId);
      if(!ownerId)c.error('NAV_OWNER_MISSING',{entityType:'navigationAction',entityId:id,field:'ownerId',message:'Navigation action has no canonical owner.'});
      if(!text(action&&action.role))c.error('NAV_ROLE_MISSING',{entityType:'navigationAction',entityId:id,field:'role',message:'Navigation action has no role.'});
      else if(!NAVIGATION_ROLES.includes(action.role))c.warn('NAV_ROLE_UNKNOWN',{entityType:'navigationAction',entityId:id,field:'role',message:`Navigation role is not registered: ${action.role}.`});
      if(!text(action&&action.destinationSource))c.error('NAV_DESTINATION_SOURCE_MISSING',{entityType:'navigationAction',entityId:id,field:'destinationSource',message:'Navigation action does not declare its canonical destination source.'});
      if(!text(action&&action.destination))c.error('NAV_DESTINATION_MISSING',{
        entityType:'navigationAction',entityId:id,field:'destination',message:'Displayed navigation action has no destination.',
        recommendation:'Bind the action to the correct canonical role destination or suppress the action.'
      });
      if(!text(action&&action.label))c.error('NAV_LABEL_MISSING',{entityType:'navigationAction',entityId:id,field:'label',message:'Navigation action has no user-facing label.'});
      if(ownerId){if(!byOwner.has(ownerId))byOwner.set(ownerId,[]);byOwner.get(ownerId).push(action);}
      const booking=bookings.get(ownerId);
      if(booking&&action.role==='rental-pickup'&&text(action.destination)!==text(booking.pickupNavigationDestination))c.error('NAV_RENTAL_PICKUP_BINDING_INVALID',{
        entityType:'booking',entityId:ownerId,field:'pickupNavigationDestination',relatedEntityId:id,
        message:'Rental pickup action is not bound to the canonical pickup destination.',
        recommendation:'Bind pickup only to the canonical pickup depot destination.'
      });
      if(booking&&action.role==='rental-return'&&text(action.destination)!==text(booking.returnNavigationDestination))c.error('NAV_RENTAL_RETURN_BINDING_INVALID',{
        entityType:'booking',entityId:ownerId,field:'returnNavigationDestination',relatedEntityId:id,
        message:'Rental return action is not bound to the canonical return destination.',
        recommendation:'Bind return only to the canonical return depot destination.'
      });
    }
    for(const [ownerId,ownerActions] of byOwner){
      const material=ownerActions.filter(action=>['rental-pickup','rental-return','shuttle-collection-point'].includes(action.role));
      const destinations=new Set(material.map(action=>normalizedDestination(action.destination)).filter(Boolean));
      if(material.length>1&&destinations.size>1)for(const action of material)if(/^navigate$/i.test(text(action.label)))c.error('NAV_LABEL_AMBIGUOUS',{
        entityType:'navigationAction',entityId:text(action.id)||null,field:'label',relatedEntityId:ownerId,
        message:'Generic Navigate label is ambiguous because the owner has multiple material destinations.',
        recommendation:'Name the role, for example Navigate to pickup depot or Navigate to return depot.'
      });
      const pickup=material.find(action=>action.role==='rental-pickup');
      const returned=material.find(action=>action.role==='rental-return');
      const booking=bookings.get(ownerId);
      if(pickup&&returned&&normalizedDestination(pickup.destination)===normalizedDestination(returned.destination)){
        const sameDepot=booking&&booking.sameDepot===true||
          normalizedDestination(booking&&booking.pickupDepotAddress)===normalizedDestination(booking&&booking.returnDepotAddress);
        if(!sameDepot)c.warn('NAV_DISTINCT_ROLES_SHARE_DESTINATION',{
          entityType:'booking',entityId:ownerId,field:'navigationDestination',
          message:'Pickup and return roles share a destination without an explicit same-depot declaration.',
          recommendation:'Confirm the depots are genuinely the same; otherwise correct the role-specific destination.'
        });
      }
    }
    return c.result({actions:actions.length,owners:byOwner.size});
  }

  function required(c,booking,id,field,code,message){
    if(!text(booking&&booking[field]))c.error(code,{entityType:'booking',entityId:id,field,message,recommendation:`Supply the authoritative ${field}; validation will not fabricate it.`});
  }
  function validateE4(data){
    const c=collector('E4');
    const bookings=recordMap(value(data,'BOOKINGS_DATA','bookings')||{});
    const counts={accommodation:0,rentalVehicle:0,flight:0,activityTour:0,other:0,deferredCandidates:0};
    for(const [id,booking] of bookings){
      const type=text(booking.type);
      const status=planningStatus(booking);
      if(['cancelled','optional','backup'].includes(status)&&!activePlanningFlag(booking)){
        counts.deferredCandidates++;
        continue;
      }
      if(type==='accommodation'){
        counts.accommodation++;
        required(c,booking,id,'title','BOOKING_ACCOMMODATION_PROPERTY_MISSING','Accommodation property name is required.');
        required(c,booking,id,'checkIn','BOOKING_ACCOMMODATION_CHECKIN_MISSING','Accommodation check-in is required.');
        required(c,booking,id,'checkOut','BOOKING_ACCOMMODATION_CHECKOUT_MISSING','Accommodation check-out is required.');
        if(!text(booking.address)&&!text(booking.placeId))c.error('BOOKING_ACCOMMODATION_LOCATION_MISSING',{entityType:'booking',entityId:id,field:'address',message:'Accommodation requires an address or canonical place relationship.'});
        if(!text(booking.stayDates)&&!text(booking.date))c.error('BOOKING_ACCOMMODATION_DATES_MISSING',{entityType:'booking',entityId:id,field:'stayDates',message:'Accommodation stay dates are required.'});
      }else if(/^(?:rentalCar|rental-vehicle|rental)$/i.test(type)){
        counts.rentalVehicle++;
        required(c,booking,id,'provider','BOOKING_RENTAL_PROVIDER_MISSING','Rental provider is required.');
        required(c,booking,id,'pickupDateTime','BOOKING_RENTAL_PICKUP_TIME_MISSING','Rental pickup date/time is required.');
        required(c,booking,id,'pickupDepotAddress','BOOKING_RENTAL_PICKUP_DEPOT_MISSING','Rental pickup depot is required.');
        required(c,booking,id,'pickupNavigationDestination','BOOKING_RENTAL_PICKUP_DESTINATION_MISSING','Rental pickup navigation destination is required.');
        required(c,booking,id,'returnDateTime','BOOKING_RENTAL_RETURN_TIME_MISSING','Rental return date/time is required.');
        required(c,booking,id,'returnDepotAddress','BOOKING_RENTAL_RETURN_DEPOT_MISSING','Rental return depot is required.');
        required(c,booking,id,'returnNavigationDestination','BOOKING_RENTAL_RETURN_DESTINATION_MISSING','Rental return navigation destination is required.');
        if(booking.oneWay===true&&normalizedDestination(booking.pickupDepotAddress)===normalizedDestination(booking.returnDepotAddress))c.warn('BOOKING_RENTAL_ONE_WAY_DEPOTS_IDENTICAL',{
          entityType:'booking',entityId:id,field:'returnDepotAddress',message:'One-way rental declares identical pickup and return depots; confirm this is intentional.'
        });
      }else if(type==='flight'){
        counts.flight++;
        required(c,booking,id,'departureDateTime','BOOKING_FLIGHT_DEPARTURE_TIME_MISSING','Flight departure date/time is required.');
        required(c,booking,id,'departureAirport','BOOKING_FLIGHT_DEPARTURE_AIRPORT_MISSING','Flight departure airport is required.');
        required(c,booking,id,'arrivalDateTime','BOOKING_FLIGHT_ARRIVAL_TIME_MISSING','Flight arrival date/time is required.');
        required(c,booking,id,'arrivalAirport','BOOKING_FLIGHT_ARRIVAL_AIRPORT_MISSING','Flight arrival airport is required.');
      }else if(type==='activity'||type==='tour'){
        counts.activityTour++;
        required(c,booking,id,'title','BOOKING_ACTIVITY_IDENTITY_MISSING','Activity/tour identity is required.');
        if(!text(booking.date)&&!text(booking.dateTime))c.error('BOOKING_ACTIVITY_DATE_MISSING',{entityType:'booking',entityId:id,field:'date',message:'Activity/tour date is required.'});
        if(!text(booking.time)&&!text(booking.dateTime))c.error('BOOKING_ACTIVITY_TIME_MISSING',{entityType:'booking',entityId:id,field:'time',message:'Activity/tour time is required.'});
        if(booking.requiresMeeting===true&&!text(booking.meetingArrangement)&&!text(booking.pickupArrangement))c.error('BOOKING_ACTIVITY_MEETING_MISSING',{
          entityType:'booking',entityId:id,field:'meetingArrangement',message:'Activity/tour requires a meeting or pickup arrangement, but none is supplied.',
          recommendation:'Supply the confirmed arrangement; do not fabricate a place.'
        });
        if(!text(booking.placeId)&&booking.operatorNonPlace!==true&&booking.standalone!==true)c.error('BOOKING_ACTIVITY_LOCATION_CLASSIFICATION_MISSING',{
          entityType:'booking',entityId:id,field:'placeId',message:'Activity/tour needs a canonical place or explicit operator/standalone classification.'
        });
      }else{
        counts.other++;
        c.warn('BOOKING_TYPE_UNSUPPORTED',{entityType:'booking',entityId:id,field:'type',message:`No type-specific validator is registered for booking type: ${type||'(missing)'}.`});
      }
    }
    return c.result(counts);
  }

  function validateE5(data){
    const c=collector('E5');
    let nonPlace=0,place=0,ambiguous=0;
    for(const {item} of itineraryItems(data)){
      const id=text(item&&item.id)||null;
      const explicit=item&&item.nonPlace===true;
      const placeId=text(item&&item.placeId);
      if(explicit){
        nonPlace++;
        if(placeId)c.error('NONPLACE_HAS_PLACE_ID',{entityType:'itineraryItem',entityId:id,field:'placeId',message:'Non-place item must not have a placeId.'});
        if(Array.isArray(item.guideIds)&&item.guideIds.length)c.error('NONPLACE_HAS_GUIDE_RELATIONSHIP',{entityType:'itineraryItem',entityId:id,field:'guideIds',message:'Non-place item must not expose a Guide relationship.'});
        for(const field of PLACE_ACTION_FIELDS)if(text(item[field])||(item[field]&&typeof item[field]==='object'))c.error('NONPLACE_HAS_PLACE_ACTION',{
          entityType:'itineraryItem',entityId:id,field,message:`Non-place item must not expose ${field}.`,
          recommendation:'Remove the place action while retaining non-place instructions and route context.'
        });
        if(item.nonPlaceRole!=null&&!NON_PLACE_ROLES.includes(item.nonPlaceRole))c.warn('NONPLACE_ROLE_UNKNOWN',{
          entityType:'itineraryItem',entityId:id,field:'nonPlaceRole',message:`Unregistered non-place role: ${item.nonPlaceRole}.`
        });
      }else if(placeId)place++;
      else{
        ambiguous++;
        c.error('NONPLACE_CLASSIFICATION_MISSING',{
          entityType:'itineraryItem',entityId:id,field:'nonPlace',
          message:'Item has no valid place relationship and is not explicitly classified as non-place.',
          recommendation:'Review the descriptive event. Link a known real venue only when authoritative, otherwise explicitly classify a genuine non-place role.'
        });
        if(/[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)+/.test(text(item&&item.title)))c.warn('NONPLACE_POSSIBLE_NAMED_VENUE',{
          entityType:'itineraryItem',entityId:id,field:'title',
          message:'Descriptive text may name a real venue; it was not auto-classified or converted into a place.',
          recommendation:'Review against authoritative trip data before assigning a place or non-place classification.'
        });
      }
    }
    return c.result({placeLinked:place,nonPlace,ambiguous,registeredRoles:NON_PLACE_ROLES.length});
  }

  function planningStatus(record){
    return record&&Object.prototype.hasOwnProperty.call(record,'planningStatus')?record.planningStatus:undefined;
  }
  function planningEntries(data){
    const entries=[];
    for(const [id,record] of recordEntries(value(data,'PLACES','places')||{}))entries.push({entityType:'place',entityId:text(record&&record.id)||text(id),record});
    for(const [id,record] of recordEntries(value(data,'BOOKINGS_DATA','bookings')||{}))entries.push({entityType:'booking',entityId:text(record&&record.id)||text(id),record});
    for(const {item} of itineraryItems(data))entries.push({entityType:'itineraryItem',entityId:text(item&&item.id),record:item});
    for(const [id,record] of recordEntries(value(data,'PLANNING_RECORDS','planningRecords')||{}))entries.push({
      entityType:text(record&&record.entityType)||'planningRecord',
      entityId:text(record&&record.id)||text(id),
      record
    });
    return entries;
  }
  function activePlanningFlag(record){
    return record&&(
      record.active===true||record.selected===true||record.mandatory===true||
      record.productionSelection===true||record.productionBooking===true||
      record.productionGuide===true||record.includeInExport===true||record.exportAsConfirmed===true
    );
  }
  function validatePlanning(data){
    const c=collector('PLANNING');
    const groups=recordMap(value(data,'PLANNING_GROUPS','planningGroups')||{});
    const membersByGroup=new Map();
    const entries=planningEntries(data);
    let statusCount=0,groupedCount=0;

    for(const [id,group] of groups){
      if(!validId(id))c.error('PLANNING_GROUP_ID_INVALID',{
        entityType:'planningGroup',entityId:id||null,field:'id',
        message:'Planning group ID must be a stable canonical identifier.',
        recommendation:'Replace it with a stable group ID and update member planningGroupId values.'
      });
      if(group&&group.primaryRequired!=null&&typeof group.primaryRequired!=='boolean')c.error('PLANNING_GROUP_PRIMARY_REQUIRED_INVALID',{
        entityType:'planningGroup',entityId:id,field:'primaryRequired',
        message:'primaryRequired must be boolean when supplied.'
      });
    }

    for(const entry of entries){
      const {entityType,entityId,record}=entry;
      if(!record||typeof record!=='object')continue;
      const status=planningStatus(record);
      const groupId=text(record.planningGroupId);
      const role=record.planningRole;
      if(status!==undefined){
        statusCount++;
        if(typeof status!=='string'||!PLANNING_STATUSES.includes(status))c.error('PLANNING_INVALID_STATUS',{
          entityType,entityId,field:'planningStatus',
          message:`Invalid planning status: ${String(status)}.`,
          recommendation:`Use one canonical value: ${PLANNING_STATUSES.join(', ')}.`
        });
      }
      if(groupId){
        groupedCount++;
        if(!groups.has(groupId))c.error('PLANNING_GROUP_UNRESOLVED',{
          entityType,entityId,field:'planningGroupId',relatedEntityId:groupId,
          message:'Planning record references a missing planning group.',
          recommendation:'Correct the group relationship or create the real generic planning decision group.'
        });
        if(!PLANNING_ROLES.includes(role))c.error('PLANNING_ROLE_INVALID',{
          entityType,entityId,field:'planningRole',relatedEntityId:groupId,
          message:'Grouped planning record must be primary or alternative.',
          recommendation:'Assign the record role within its existing planning group.'
        });
        if(!membersByGroup.has(groupId))membersByGroup.set(groupId,[]);
        membersByGroup.get(groupId).push(entry);
      }else if(role!==undefined)c.error('PLANNING_ROLE_WITHOUT_GROUP',{
        entityType,entityId,field:'planningRole',
        message:'Planning role is present without a planningGroupId.',
        recommendation:'Attach the record to its planning decision group or remove the orphan role.'
      });

      if(status==='cancelled'&&activePlanningFlag(record))c.error('PLANNING_CANCELLED_ACTIVE',{
        entityType,entityId,field:'planningStatus',
        message:'Cancelled record is marked for active production use.',
        recommendation:'Keep it editable/searchable, but remove active, selection, Guide, booking, and export production flags.'
      });
      if(status==='optional'&&(record.mandatory===true||record.required===true||record.productionSelection===true))c.error('PLANNING_OPTIONAL_MANDATORY',{
        entityType,entityId,field:'planningStatus',
        message:'Optional record is being treated as mandatory.',
        recommendation:'Remove the mandatory/required production selection flag or promote the status intentionally.'
      });
      if(status==='backup'&&(record.productionSelection===true||record.exportAsConfirmed===true||record.productionBooking===true))c.error('PLANNING_BACKUP_ACTIVE',{
        entityType,entityId,field:'planningStatus',
        message:'Backup record is being treated as the active or confirmed production selection.',
        recommendation:'Promote the backup intentionally before production selection or export.'
      });
    }

    for(const [groupId,members] of membersByGroup){
      const selectable=members.filter(({record})=>planningStatus(record)!=='cancelled');
      const primary=selectable.filter(({record})=>record.planningRole==='primary');
      const confirmed=selectable.filter(({record})=>planningStatus(record)==='confirmed');
      if(primary.length>1)c.error('PLANNING_DUPLICATE_PRIMARY',{
        entityType:'planningGroup',entityId:groupId,field:'planningRole',
        message:`Planning group has ${primary.length} primary records.`,
        recommendation:'Keep exactly one primary and retain the other candidates as alternatives.'
      });
      if(confirmed.length>1)c.error('PLANNING_DUPLICATE_CONFIRMED',{
        entityType:'planningGroup',entityId:groupId,field:'planningStatus',
        message:`Planning group has ${confirmed.length} confirmed selections.`,
        recommendation:'Keep one confirmed selection; retain other candidates as planned, backup, or optional according to authoritative intent.'
      });
      const group=groups.get(groupId);
      if(group&&group.primaryRequired===true&&selectable.length>0&&primary.length===0)c.error('PLANNING_PRIMARY_MISSING',{
        entityType:'planningGroup',entityId:groupId,field:'planningRole',
        message:'Planning group requires a primary but has none.',
        recommendation:'Promote one existing selectable candidate to primary.'
      });
    }
    return c.result({
      records:entries.length,
      recordsWithStatus:statusCount,
      groups:groups.size,
      groupedRecords:groupedCount,
      allowedStatuses:PLANNING_STATUSES.length
    });
  }

  function isProductionEligible(record,channel){
    const status=planningStatus(record);
    const target=channel||'selection';
    if(status===undefined)return true;
    if(target==='edit'||target==='search')return true;
    if(status==='cancelled')return false;
    if(status==='backup')return !['selection','confirmed-export','production-booking'].includes(target);
    if(status==='optional')return !['mandatory','selection'].includes(target);
    return true;
  }
  function filterProductionRecords(records,channel){
    return (Array.isArray(records)?records:[]).filter(record=>isProductionEligible(record,channel));
  }
  function cloneData(data){
    if(typeof structuredClone==='function')return structuredClone(data);
    return JSON.parse(JSON.stringify(data));
  }
  function mutablePlanningRecord(data,entityType,entityId){
    const id=text(entityId);
    const collectionName=entityType==='place'?(data.PLACES?'PLACES':'places'):
      entityType==='booking'?(data.BOOKINGS_DATA?'BOOKINGS_DATA':'bookings'):null;
    if(collectionName){
      const collection=data[collectionName];
      if(Array.isArray(collection))return collection.find(record=>text(record&&record.id)===id)||null;
      return collection&&collection[id]||null;
    }
    if(entityType==='itineraryItem'){
      for(const {item} of itineraryItems(data))if(text(item&&item.id)===id)return item;
      return null;
    }
    const records=data.PLANNING_RECORDS||data.planningRecords;
    if(Array.isArray(records))return records.find(record=>text(record&&record.id)===id)||null;
    return records&&records[id]||null;
  }
  function promotePlanningRecord(data,change,config){
    const candidate=cloneData(data);
    const entityType=text(change&&change.entityType);
    const entityId=text(change&&change.entityId);
    const record=mutablePlanningRecord(candidate,entityType,entityId);
    if(!record)throw new Error(`Planning record not found: ${entityType}/${entityId}`);
    const groupId=text(record.planningGroupId);
    if(change&&change.planningRole==='primary'&&groupId){
      for(const entry of planningEntries(candidate)){
        if(entry.record!==record&&text(entry.record&&entry.record.planningGroupId)===groupId&&entry.record.planningRole==='primary'){
          entry.record.planningRole='alternative';
        }
      }
    }
    if(change&&change.planningStatus!==undefined)record.planningStatus=change.planningStatus;
    if(change&&change.planningRole!==undefined)record.planningRole=change.planningRole;
    const result=validateTripData(candidate,config);
    return {accepted:result.valid,data:result.valid?candidate:data,candidate,result};
  }

  function validateTripData(data,config){
    const stageResults={
      E1:validateE1(data,config),
      E2:validateE2(data,config),
      E3:validateE3(data,config),
      E4:validateE4(data,config),
      E5:validateE5(data,config),
      PLANNING:validatePlanning(data,config)
    };
    const errors=STAGES.flatMap(stage=>stageResults[stage].errors);
    const warnings=STAGES.flatMap(stage=>stageResults[stage].warnings);
    return {
      valid:errors.length===0,
      status:errors.length===0?'PASS':'FAIL',
      blockingErrorCount:errors.length,
      warningCount:warnings.length,
      errors,warnings,issues:[...errors,...warnings],
      stages:stageResults,
      summary:{
        entityCounts:stageResults.E1.summary,
        relationshipCounts:stageResults.E2.summary,
        navigationCounts:stageResults.E3.summary,
        bookingCounts:stageResults.E4.summary,
        nonPlaceCounts:stageResults.E5.summary,
        planningCounts:stageResults.PLANNING.summary
      }
    };
  }
  function formatValidationReport(result,options){
    const markdown=!options||options.format!=='text';
    const lines=[];
    if(markdown)lines.push('# Travel Engine Integrity Failure Report','',`## ${result.status}`,'');
    else lines.push(`TRAVEL ENGINE INTEGRITY ${result.status}`,'');
    lines.push(`Blocking errors: ${result.blockingErrorCount}`,`Warnings: ${result.warningCount}`,'');
    for(const item of result.issues){
      const heading=`${item.severity==='error'?'FAIL':'WARNING'} ${item.code}`;
      lines.push(markdown?`## ${heading}`:heading,'');
      lines.push(`Stage: ${item.stage}`);
      if(item.entityType)lines.push(`Entity: ${item.entityType}${item.entityId?` / ${item.entityId}`:''}`);
      if(item.field)lines.push(`Field: ${item.field}`);
      if(item.relatedEntityId)lines.push(`Related entity: ${item.relatedEntityId}`);
      lines.push(`Message: ${item.message}`);
      if(item.recommendation)lines.push(`Recommended correction: ${item.recommendation}`);
      lines.push('');
    }
    if(!result.issues.length)lines.push('No validation issues.');
    return lines.join('\n').trim()+'\n';
  }
  function acceptTripData(data,config){
    const result=validateTripData(data,config);
    if(!result.valid){
      const error=new Error(formatValidationReport(result,{format:'text'}));
      error.name='TravelEngineIntegrityError';
      error.validationResult=result;
      throw error;
    }
    return result;
  }

  return Object.freeze({
    version:'2.1.0-planning-semantics',
    STAGES,INTEGRITY_STAGES,PLANNING_STATUSES,PLANNING_ROLES,NON_PLACE_ROLES,NAVIGATION_ROLES,
    validateE1,validateE2,validateE3,validateE4,validateE5,
    validatePlanning,validateTripData,acceptTripData,formatValidationReport,
    isProductionEligible,filterProductionRecords,promotePlanningRecord
  });
});
