/* Travel Engine V2 — RC22 authoritative Master File Importer V1. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.MasterFileImporter=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='1.0.0';
  const SECTION_ALIASES=Object.freeze({
    trip:'trip',trips:'trip',
    accommodation:'accommodation',accommodations:'accommodation',hotel:'accommodation',hotels:'accommodation',stay:'accommodation',stays:'accommodation',
    restaurant:'restaurant',restaurants:'restaurant',cafe:'restaurant',cafes:'restaurant','café':'restaurant','cafés':'restaurant',dining:'restaurant',
    activity:'activity',activities:'activity',attraction:'activity',attractions:'activity',tour:'activity',tours:'activity',
    rental:'rental',rentals:'rental','rental vehicle':'rental','rental car':'rental','car rental':'rental',
    flight:'flight',flights:'flight',
    transport:'transport',transfer:'transport',transfers:'transport',
    note:'notes',notes:'notes','travel notes':'notes','travel tips':'notes',
    unknown:'unknown'
  });
  const FIELD_ALIASES=Object.freeze({
    name:'name',title:'name',property:'name',venue:'name',provider:'provider',operator:'provider',
    'trip name':'tripName',destination:'destination','start date':'startDate','end date':'endDate',version:'version',
    id:'id','place id':'placeId',placeid:'placeId','booking id':'bookingId',bookingid:'bookingId',
    day:'day',date:'date',time:'time',description:'description',details:'description',
    note:'notes',notes:'notes',tip:'tips',tips:'tips',
    address:'address',location:'location',map:'navigationDestination',maps:'navigationDestination',
    navigate:'navigationDestination','navigation destination':'navigationDestination',
    category:'category','guide category':'category',
    reference:'reference','booking reference':'reference','confirmation reference':'reference',
    'check in':'checkIn','check-in':'checkIn','check out':'checkOut','check-out':'checkOut',
    'stay dates':'stayDates',dates:'stayDates',
    'departure airport':'departureAirport','arrival airport':'arrivalAirport',
    'departure time':'departureDateTime','arrival time':'arrivalDateTime',
    airline:'airline',carrier:'airline','flight number':'flightNumber',
    'pickup time':'pickupDateTime','pickup date/time':'pickupDateTime',
    pickup:'pickupDepotAddress','pickup location':'pickupDepotAddress','pickup depot':'pickupDepotAddress','pickup address':'pickupDepotAddress',
    'pickup navigation':'pickupNavigationDestination',
    'return time':'returnDateTime','return date/time':'returnDateTime',
    return:'returnDepotAddress','return location':'returnDepotAddress','return depot':'returnDepotAddress','return address':'returnDepotAddress',
    'return navigation':'returnNavigationDestination',
    'shuttle collection point':'shuttleCollectionAddress',
    'meeting point':'meetingArrangement','meeting arrangement':'meetingArrangement',
    'planning status':'planningStatus','planning group':'planningGroupId','planning role':'planningRole',
    'non place':'nonPlace','non-place':'nonPlace','non place role':'nonPlaceRole','non-place role':'nonPlaceRole',
    'add to itinerary':'addToItinerary'
  });
  const SCHEMAS=Object.freeze({
    trip:Object.freeze({entity:'tripConfig'}),
    accommodation:Object.freeze({entity:'booking',bookingType:'accommodation',guideCategory:'STAY'}),
    restaurant:Object.freeze({entity:'place',guideCategory:'DINING'}),
    activity:Object.freeze({entity:'activity',guideCategory:'ACTIVITIES'}),
    rental:Object.freeze({entity:'booking',bookingType:'rentalCar'}),
    flight:Object.freeze({entity:'booking',bookingType:'flight'}),
    transport:Object.freeze({entity:'timeline',nonPlaceRole:'transfer-instruction'}),
    notes:Object.freeze({entity:'note'}),
    unknown:Object.freeze({entity:'unknown'})
  });

  function text(value){return typeof value==='string'?value.trim():'';}
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function normalizeKey(value){
    return text(value).toLowerCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ');
  }
  function sectionType(value){
    const key=normalizeKey(value).replace(/^day\s+\d+(?:\s*[·:—-].*)?$/,'day');
    if(key==='day')return 'day';
    return SECTION_ALIASES[key]||'unknown';
  }
  function fieldName(value){return FIELD_ALIASES[normalizeKey(value)]||null;}
  function slug(value){
    const result=text(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
    return result||'unnamed';
  }
  function booleanValue(value){
    if(typeof value==='boolean')return value;
    if(/^(?:true|yes|y|1)$/i.test(text(value)))return true;
    if(/^(?:false|no|n|0)$/i.test(text(value)))return false;
    return value;
  }
  function dayNumber(value){
    const match=text(value).match(/(?:day\s*)?(\d+)/i);
    return match?String(Number(match[1])):'';
  }
  function warning(code,message,details){
    return Object.assign({stage:'PARSE',code,severity:'warning',section:null,record:null,line:null,message},details||{});
  }
  function question(code,record,reason,prompt,suggestion,confidence,field){
    return {
      stage:'QUESTIONS',code,section:record&&record.section||null,
      entityId:record&&record.canonicalId||null,entityName:record&&record.name||null,
      field:field||null,reason,question:prompt,
      suggestedInterpretation:suggestion||null,confidence:Number(confidence)||0
    };
  }
  function newRecord(section,line,name){
    return {section,line,name:text(name),fields:{},unknownFields:{},notes:[],tips:[],rawLines:[]};
  }
  function recordHasContent(record){
    return Boolean(record&&(record.name||record.rawLines.length||Object.keys(record.fields).length||record.notes.length||record.tips.length));
  }
  function parse(masterText){
    const raw=typeof masterText==='string'?masterText:String(masterText==null?'':masterText);
    const lines=raw.replace(/\r\n?/g,'\n').split('\n');
    const sections=[],warnings=[];
    let currentSection=null,currentRecord=null;
    function ensureSection(type,title,line){
      currentSection={type,title:text(title),line,records:[],rawLines:[]};
      sections.push(currentSection);currentRecord=null;
      return currentSection;
    }
    function ensureRecord(line,name){
      if(!currentSection)ensureSection('unknown','Unsectioned',line);
      currentRecord=newRecord(currentSection.type,line,name);
      currentSection.records.push(currentRecord);
      return currentRecord;
    }
    function pushRaw(lineNo,line){
      if(!currentSection)ensureSection('unknown','Unsectioned',lineNo);
      currentSection.rawLines.push(line);
      if(currentRecord)currentRecord.rawLines.push(line);
    }
    for(let index=0;index<lines.length;index++){
      const lineNo=index+1,original=lines[index],trimmed=original.trim();
      if(!trimmed)continue;
      const heading=trimmed.match(/^(#{1,6})\s+(.+)$/);
      if(heading){
        const title=text(heading[2]),type=sectionType(title);
        const dayMatch=title.match(/^day\s+(\d+)(?:\s*[·:—-]\s*(.*))?$/i);
        if(heading[1].length<=2||type!=='unknown'||dayMatch){
          ensureSection(dayMatch?'day':type,title,lineNo);
          if(dayMatch){
            currentSection.day=String(Number(dayMatch[1]));
            currentSection.heading=text(dayMatch[2]);
          }
        }else ensureRecord(lineNo,title);
        continue;
      }
      const bareType=sectionType(trimmed.replace(/:$/,''));
      const bareDay=trimmed.match(/^day\s+(\d+)(?:\s*[·:—-]\s*(.*))?$/i);
      if((bareType!=='unknown'||bareDay)&&!trimmed.includes(':')){
        ensureSection(bareDay?'day':bareType,trimmed,lineNo);
        if(bareDay){currentSection.day=String(Number(bareDay[1]));currentSection.heading=text(bareDay[2]);}
        continue;
      }
      if(/^---+$/.test(trimmed)){currentRecord=null;continue;}
      const field=trimmed.match(/^(?:[-*]\s*)?([^:]{1,50}):\s*(.*)$/);
      if(field){
        const canonical=fieldName(field[1]);
        if(!currentRecord){
          const canBelongToSection=currentSection&&currentSection.type==='trip';
          if(canBelongToSection)ensureRecord(lineNo,'Trip');
          else ensureRecord(lineNo,'');
        }
        const value=field[2];
        if(canonical){
          if(canonical==='notes'||canonical==='tips'){
            if(value)currentRecord[canonical].push(value);
          }else currentRecord.fields[canonical]=value;
        }else{
          currentRecord.unknownFields[text(field[1])]=value;
          warnings.push(warning('IMPORT_FIELD_UNKNOWN',`Unknown field "${text(field[1])}" was preserved.`,{section:currentSection.type,record:currentRecord.name||null,line:lineNo}));
        }
        currentRecord.rawLines.push(original);
        continue;
      }
      const bullet=trimmed.match(/^[-*]\s+(.+)$/);
      if(bullet){
        if(!currentRecord)ensureRecord(lineNo,currentSection&&currentSection.type==='notes'?'Notes':'');
        currentRecord.notes.push(bullet[1]);
        currentRecord.rawLines.push(original);
        continue;
      }
      if(/^(?:preferred|primary|backup|alternative|optional|maybe|tentative|cancelled)$/i.test(trimmed)&&currentRecord){
        currentRecord.notes.push(trimmed);
        currentRecord.rawLines.push(original);
        continue;
      }
      if(!currentRecord||recordHasContent(currentRecord))ensureRecord(lineNo,trimmed);
      else currentRecord.name=trimmed;
      currentRecord.rawLines.push(original);
    }
    for(const section of sections){
      if(section.type==='unknown')warnings.push(warning('IMPORT_SECTION_UNKNOWN',`Unknown section "${section.title}" was preserved for review.`,{section:'unknown',line:section.line}));
      section.records=section.records.filter(recordHasContent);
      for(const record of section.records){
        if(!record.name&&record.fields.name)record.name=text(record.fields.name);
        if(!record.name&&section.type!=='trip'&&section.type!=='notes'){
          warnings.push(warning('IMPORT_RECORD_NAME_MISSING','A record has no name and cannot receive a stable canonical ID.',{section:section.type,line:record.line}));
        }
      }
    }
    if(!text(raw))warnings.push(warning('IMPORT_INPUT_EMPTY','Master File input is empty.',{line:1}));
    else if(!sections.length)warnings.push(warning('IMPORT_INPUT_MALFORMED','No recognizable Master File structure was found.',{line:1}));
    return {version:VERSION,sourceText:raw,sections,warnings};
  }

  function normalize(parsed){
    const warnings=[...(parsed&&parsed.warnings||[])],records=[];
    const used=new Map();
    function uniqueId(base,record){
      const requested=text(record.fields.id);
      const seed=slug(requested||record.name);
      if(requested&&requested!==seed)warnings.push(warning(
        'IMPORT_ID_NORMALIZED',
        `Explicit ID "${requested}" required structural normalization to "${seed}".`,
        {section:record.section,record:record.name,line:record.line}
      ));
      const count=(used.get(seed)||0)+1;used.set(seed,count);
      if(count>1)warnings.push(warning('IMPORT_ID_COLLISION',`Canonical ID "${seed}" occurs more than once; occurrence ${count} received a deterministic suffix.`,{section:record.section,record:record.name,line:record.line}));
      return count===1?seed:`${seed}-${count}`;
    }
    for(const section of parsed&&parsed.sections||[]){
      for(const source of section.records){
        const record=clone(source);
        record.section=section.type;
        record.schema=SCHEMAS[section.type]||SCHEMAS.unknown;
        if(section.type==='day'){
          record.schema=SCHEMAS.activity;
          record.day=section.day||'';
          record.dayHeading=section.heading||'';
        }
        record.name=text(record.fields.name)||record.name;
        record.canonicalId=uniqueId(record.name||`${section.type}-${record.line}`,record);
        record.originalWording={
          name:record.name,fields:clone(record.fields),unknownFields:clone(record.unknownFields),
          notes:clone(record.notes),tips:clone(record.tips),text:record.rawLines.join('\n')
        };
        if(record.fields.day)record.day=dayNumber(record.fields.day);
        if(record.fields.nonPlace!==undefined)record.fields.nonPlace=booleanValue(record.fields.nonPlace);
        if(record.fields.addToItinerary!==undefined)record.fields.addToItinerary=booleanValue(record.fields.addToItinerary);
        records.push(record);
      }
    }
    return {version:VERSION,sourceText:parsed.sourceText,records,warnings};
  }

  function buildRelationships(normalized){
    const canonicalData={
      PLACES:{},CATEGORIES:{STAY:[],DINING:[],ACTIVITIES:[]},GUIDE_ORDER:[],DAY_LINKS:{},
      ACTIVITIES:{},BOOKINGS_DATA:{},NAVIGATION_ACTIONS:[],TRIP_DATA:{},TRIP_ORDER:[],
      ITINERARY_DATA:{},NOTES:[],IMPORT_SOURCE:{version:VERSION}
    };
    const warnings=[...(normalized&&normalized.warnings||[])];
    const config={tripName:'',startDate:'',endDate:'',version:''};
    const byName=new Map();
    function assignExplicitPlanning(target,record){
      for(const field of ['planningStatus','planningGroupId','planningRole']){
        if(record.fields[field]!==undefined)target[field]=text(record.fields[field]);
      }
    }
    function preserved(target,record){
      target.sourceWording=clone(record.originalWording);
      if(record.notes.length)target.notes=clone(record.notes);
      if(record.tips.length)target.tips=clone(record.tips);
      if(record.fields.description!==undefined)target.description=record.fields.description;
      for(const [key,value] of Object.entries(record.unknownFields))target.sourceWording.unknownFields[key]=value;
      assignExplicitPlanning(target,record);
      return target;
    }
    function addPlace(record,category){
      const id=record.canonicalId;
      if(canonicalData.PLACES[id])return canonicalData.PLACES[id];
      const place=preserved({
        id,title:record.name,cat:category,
        address:text(record.fields.address||record.fields.location),
        maps:text(record.fields.navigationDestination)
      },record);
      canonicalData.PLACES[id]=place;
      if(!canonicalData.CATEGORIES[category])canonicalData.CATEGORIES[category]=[];
      canonicalData.CATEGORIES[category].push({key:id});
      canonicalData.GUIDE_ORDER.push(id);
      byName.set(normalizeKey(record.name),id);
      return place;
    }
    function bookingBase(record,type){
      const base=slug(record.fields.bookingId||`${record.canonicalId}-booking`);
      let id=base,index=1;
      while(canonicalData.BOOKINGS_DATA[id]){index++;id=`${base}-${index}`;}
      if(id!==base)warnings.push(warning('IMPORT_BOOKING_ID_COLLISION',`Booking ID "${base}" occurs more than once; this record received "${id}".`,{section:record.section,record:record.name,line:record.line}));
      return preserved({id,type,title:record.name},record);
    }
    function ensureDay(record){
      const day=record.day||dayNumber(record.fields.day);
      if(!day)return null;
      if(!canonicalData.ITINERARY_DATA[day]){
        canonicalData.ITINERARY_DATA[day]={
          id:`day${day}`,title:`Day ${day}`,kicker:`Day ${day}`,
          heading:record.dayHeading||`Day ${day}`,items:[]
        };
      }else if(record.dayHeading&&!canonicalData.ITINERARY_DATA[day].heading){
        canonicalData.ITINERARY_DATA[day].heading=record.dayHeading;
      }
      return canonicalData.ITINERARY_DATA[day];
    }
    function linkDay(placeId,day){
      if(!placeId||!day)return;
      if(!canonicalData.DAY_LINKS[placeId])canonicalData.DAY_LINKS[placeId]=[];
      const link=[`Day ${day}`,`day.html?day=${day}`];
      if(!canonicalData.DAY_LINKS[placeId].some(existing=>String(existing[0])===link[0]))canonicalData.DAY_LINKS[placeId].push(link);
    }
    function itineraryItem(record,placeId,bookingId,defaults){
      const day=ensureDay(record);
      if(!day)return null;
      const item=preserved(Object.assign({
        id:record.canonicalId,time:text(record.fields.time),title:record.name,
        details:record.fields.description?[record.fields.description]:clone(record.notes),
        dayId:`day${record.day}`,placeId:placeId||null,bookingId:bookingId||null
      },defaults||{}),record);
      day.items.push(item);
      linkDay(placeId,record.day);
      return item;
    }
    for(const record of normalized&&normalized.records||[]){
      const f=record.fields;
      if(record.section==='trip'){
        const mapping={tripName:'tripName',startDate:'startDate',endDate:'endDate',version:'version',destination:'destination'};
        for(const [field,target] of Object.entries(mapping))if(f[field])config[target]=text(f[field]);
        if(f.name)config.tripName=text(f.name);
        if(record.name&&record.name!=='Trip'&&!config.tripName)config.tripName=record.name;
        Object.assign(canonicalData.IMPORT_SOURCE,{trip:clone(record.originalWording)});
      }else if(record.section==='accommodation'){
        const place=addPlace(record,'STAY');
        const booking=bookingBase(record,'accommodation');
        booking.placeId=place.id;
        for(const field of ['date','time','reference','checkIn','checkOut','stayDates','address']){
          if(f[field]!==undefined)booking[field]=f[field];
        }
        if(!booking.address)booking.address=place.address;
        canonicalData.BOOKINGS_DATA[booking.id]=booking;
        itineraryItem(record,place.id,booking.id,{type:'rest'});
      }else if(record.section==='restaurant'){
        const place=addPlace(record,text(f.category).toUpperCase()||'DINING');
        itineraryItem(record,place.id,null,{type:'meal'});
      }else if(record.section==='activity'||record.section==='day'){
        const activity=preserved({id:record.canonicalId,title:record.name},record);
        for(const field of ['date','time','address','location','meetingArrangement'])if(f[field]!==undefined)activity[field]=f[field];
        canonicalData.ACTIVITIES[activity.id]=activity;
        let placeId=text(f.placeId);
        if(!placeId&&(f.address||f.location))placeId=addPlace(record,text(f.category).toUpperCase()||'ACTIVITIES').id;
        if(f.nonPlace===true){
          itineraryItem(record,null,null,{type:'activity',nonPlace:true,nonPlaceRole:text(f.nonPlaceRole)||'transfer-instruction'});
        }else itineraryItem(record,placeId||null,null,{type:'activity'});
      }else if(record.section==='rental'){
        const booking=bookingBase(record,'rentalCar');
        booking.standalone=true;
        for(const field of ['provider','reference','pickupDateTime','pickupDepotAddress','pickupNavigationDestination','returnDateTime','returnDepotAddress','returnNavigationDestination','shuttleCollectionAddress']){
          if(f[field]!==undefined)booking[field]=f[field];
        }
        canonicalData.BOOKINGS_DATA[booking.id]=booking;
        for(const role of ['pickup','return']){
          const destination=booking[`${role}NavigationDestination`];
          if(destination)canonicalData.NAVIGATION_ACTIONS.push({
            id:`${booking.id}-${role}`,ownerId:booking.id,role:`rental-${role}`,
            destinationSource:`${role}NavigationDestination`,destination,
            label:`Navigate to ${role} depot`
          });
        }
      }else if(record.section==='flight'){
        const booking=bookingBase(record,'flight');
        booking.standalone=true;
        for(const field of ['reference','departureDateTime','departureAirport','arrivalDateTime','arrivalAirport','airline','flightNumber']){
          if(f[field]!==undefined)booking[field]=f[field];
        }
        canonicalData.BOOKINGS_DATA[booking.id]=booking;
      }else if(record.section==='transport'){
        itineraryItem(record,null,null,{type:'transport',nonPlace:true,nonPlaceRole:text(f.nonPlaceRole)||'transfer-instruction'});
      }else if(record.section==='notes'){
        canonicalData.NOTES.push(preserved({id:record.canonicalId,title:record.name||'Notes'},record));
      }else{
        canonicalData.NOTES.push(preserved({id:record.canonicalId,title:record.name||'Unknown',unresolvedSection:true},record));
      }
    }
    for(const record of normalized&&normalized.records||[]){
      const explicit=text(record.fields.placeId);
      if(explicit&&!canonicalData.PLACES[explicit]){
        const byTitle=byName.get(normalizeKey(explicit));
        if(byTitle){
          for(const day of Object.values(canonicalData.ITINERARY_DATA)){
            for(const item of day.items)if(item.id===record.canonicalId)item.placeId=byTitle;
          }
        }
      }
    }
    canonicalData.CANONICAL_REFERENCES=[];
    for(const [day,dayData] of Object.entries(canonicalData.ITINERARY_DATA)){
      for(const item of dayData.items){
        if(item.placeId)canonicalData.CANONICAL_REFERENCES.push({entityType:'place',entityId:item.placeId,field:`ITINERARY_DATA.${day}.${item.id}.placeId`});
        if(item.bookingId)canonicalData.CANONICAL_REFERENCES.push({entityType:'booking',entityId:item.bookingId,field:`ITINERARY_DATA.${day}.${item.id}.bookingId`});
      }
    }
    return {version:VERSION,sourceText:normalized.sourceText,records:normalized.records,canonicalData,config,warnings};
  }

  function generateQuestions(relationshipResult){
    const questions=[];
    const records=relationshipResult&&relationshipResult.records||[];
    const canonical=relationshipResult&&relationshipResult.canonicalData||{};
    const preference=/\b(?:preferred|primary|backup|alternative|optional|maybe|tentative|cancelled)\b/i;
    const alternatives=/\b(.+?)\s+or\s+(.+)\b/i;
    for(const record of records){
      const wording=[record.name,...Object.values(record.fields),...record.notes].join(' ');
      if(preference.test(wording)&&record.fields.planningStatus===undefined){
        questions.push(question(
          'IMPORT_PLANNING_STATUS_AMBIGUOUS',record,
          'Planning language appears in the Master File, but no explicit planningStatus field was supplied.',
          `What planning status should "${record.name}" use?`,
          'Review confirmed, planned, backup, optional, or cancelled; no status was applied.',0.72,'planningStatus'
        ));
      }
      if(alternatives.test(record.name)||alternatives.test(String(record.fields.description||''))){
        questions.push(question(
          'IMPORT_ALTERNATIVES_AMBIGUOUS',record,
          'The wording describes alternatives but does not define their canonical records, group, or selection.',
          `Should the alternatives in "${record.name}" be separate records in one planning group?`,
          'Create separate canonical candidates, then explicitly choose group, primary/alternative roles, and statuses.',0.84,'planningGroupId'
        ));
      }
      if(record.section==='activity'||record.section==='day'){
        const item=Object.values(canonical.ITINERARY_DATA||{}).flatMap(day=>day.items||[]).find(candidate=>candidate.id===record.canonicalId);
        const missingPlace=item&&item.placeId&&!canonical.PLACES[item.placeId];
        if(item&&(!item.placeId||missingPlace)&&item.nonPlace!==true){
          questions.push(question(
            missingPlace?'IMPORT_PLACE_REFERENCE_UNRESOLVED':'IMPORT_ACTIVITY_CLASSIFICATION_AMBIGUOUS',record,
            missingPlace?'The supplied placeId does not resolve to a canonical place.':'The activity has neither a canonical place relationship nor an explicit non-place classification.',
            missingPlace?`Which canonical place should "${record.name}" reference?`:`Is "${record.name}" a real place event or a non-place timeline instruction?`,
            'Supply an existing placeId or explicitly set Non-place and a non-place role.',missingPlace?0.99:0.9,'placeId'
          ));
        }
      }
      if(record.section==='rental'){
        for(const role of ['pickup','return']){
          const location=text(record.fields[`${role}DepotAddress`]);
          if(/^(?:airport|station|hotel|city cent(?:re|er)|downtown)$/i.test(location)){
            questions.push(question(
              'IMPORT_LOCATION_AMBIGUOUS',record,
              `The ${role} location "${location}" is not specific enough to identify a canonical destination.`,
              `Which ${location.toLowerCase()} is the rental ${role} location?`,
              `Supply the confirmed ${role} depot/location and its independent navigation destination.`,0.99,`${role}DepotAddress`
            ));
          }
          if(record.fields[`${role}DepotAddress`]&&!record.fields[`${role}NavigationDestination`]){
            questions.push(question(
              'IMPORT_RENTAL_NAVIGATION_MISSING',record,
              `${role[0].toUpperCase()+role.slice(1)} location is present but its canonical navigation destination is missing.`,
              `What navigation destination should the rental ${role} action use?`,
              `Bind an explicit ${role} navigation destination; do not reuse another depot automatically.`,0.95,`${role}NavigationDestination`
            ));
          }
        }
      }
      if(record.section==='flight'){
        if(!text(record.fields.departureAirport))questions.push(question('IMPORT_FLIGHT_DEPARTURE_AMBIGUOUS',record,'No departure airport was supplied.',`Which departure airport applies to "${record.name}"?`,'Supply the airport name or code exactly as confirmed.',0.98,'departureAirport'));
        if(!text(record.fields.arrivalAirport))questions.push(question('IMPORT_FLIGHT_ARRIVAL_AMBIGUOUS',record,'No arrival airport was supplied.',`Which arrival airport applies to "${record.name}"?`,'Supply the airport name or code exactly as confirmed.',0.98,'arrivalAirport'));
      }
      if(record.section==='unknown'){
        questions.push(question('IMPORT_SECTION_REVIEW_REQUIRED',record,'The section is not recognized by the importer schema.',`How should "${record.name||'this content'}" be classified?`,'Choose a supported section or retain it as an unresolved note.',0.2,'section'));
      }
    }
    const planningCandidates=records.filter(record=>preference.test([record.name,...record.notes].join(' '))&&!record.fields.planningGroupId);
    for(let i=0;i<planningCandidates.length;i++){
      for(let j=i+1;j<planningCandidates.length;j++){
        const a=planningCandidates[i],b=planningCandidates[j];
        if(a.section===b.section&&(a.day||'')===(b.day||'')){
          questions.push(question(
            'IMPORT_PLANNING_GROUP_AMBIGUOUS',a,
            `"${a.name}" and "${b.name}" look like candidates in the same context, but no planning group was supplied.`,
            `Are "${a.name}" and "${b.name}" alternatives in the same planning group?`,
            'If yes, supply one planningGroupId and explicit primary/alternative roles.',0.63,'planningGroupId'
          ));
        }
      }
    }
    const unique=new Map();
    for(const item of questions){
      const key=[item.code,item.entityId,item.field,item.question].join('|');
      if(!unique.has(key))unique.set(key,item);
    }
    return [...unique.values()];
  }

  function statistics(result){
    const data=result.canonicalData||{};
    return {
      entities:Object.keys(data.PLACES||{}).length+Object.keys(data.ACTIVITIES||{}).length+Object.keys(data.BOOKINGS_DATA||{}).length,
      bookings:Object.keys(data.BOOKINGS_DATA||{}).length,
      guidePlaces:Object.keys(data.PLACES||{}).length,
      activities:Object.keys(data.ACTIVITIES||{}).length,
      itineraryDays:Object.keys(data.ITINERARY_DATA||{}).length,
      itineraryItems:Object.values(data.ITINERARY_DATA||{}).reduce((sum,day)=>sum+(day.items||[]).length,0),
      unresolvedQuestions:(result.questions||[]).length,
      warnings:(result.warnings||[]).length
    };
  }
  function importMasterFile(masterText){
    const parsed=parse(masterText);
    const normalized=normalize(parsed);
    const related=buildRelationships(normalized);
    const questions=generateQuestions(related);
    const result={
      version:VERSION,canonicalData:related.canonicalData,config:related.config,
      questions,warnings:related.warnings,statistics:{},stages:{parsed,normalized,relationships:related}
    };
    result.statistics=statistics(result);
    return result;
  }
  function formatReport(result,options){
    const markdown=!options||options.format!=='text';
    const s=result.statistics||statistics(result);
    const lines=markdown?['# Master File Import Report','']:['MASTER FILE IMPORT REPORT',''];
    lines.push(`Entities: ${s.entities}`,`Bookings: ${s.bookings}`,`Guide places: ${s.guidePlaces}`,`Activities: ${s.activities}`,`Itinerary days: ${s.itineraryDays}`,`Itinerary items: ${s.itineraryItems}`,`Unresolved questions: ${s.unresolvedQuestions}`,`Warnings: ${s.warnings}`,'');
    if(result.questions&&result.questions.length){
      lines.push(markdown?'## Questions':'QUESTIONS','');
      result.questions.forEach((item,index)=>{
        lines.push(`${index+1}. [${item.code}] ${item.question}`,`   Reason: ${item.reason}`,`   Suggested interpretation: ${item.suggestedInterpretation||'None'}`,`   Confidence: ${item.confidence}`,'');
      });
    }
    if(result.warnings&&result.warnings.length){
      lines.push(markdown?'## Warnings':'WARNINGS','');
      result.warnings.forEach((item,index)=>lines.push(`${index+1}. [${item.code}] ${item.message}`));
    }
    if(!(result.questions||[]).length&&!(result.warnings||[]).length)lines.push('No importer questions or warnings.');
    return lines.join('\n').trim()+'\n';
  }

  return Object.freeze({
    version:VERSION,SCHEMAS,SECTION_ALIASES,
    import:importMasterFile,parse,normalize,buildRelationships,generateQuestions,formatReport
  });
});
