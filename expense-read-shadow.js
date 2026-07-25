/* Stage 3.2E observational canonical Expense read-shadow coordinator. */
(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports?require('./legacy-expense-adapter.js'):root.CCMV_LEGACY_EXPENSE_ADAPTER,
    typeof module==='object'&&module.exports?require('./expense-calculator.js'):root.CCMV_EXPENSE_CALCULATOR,
    typeof module==='object'&&module.exports?require('./canonical-expense-local-provider.js'):root.CCMV_CANONICAL_EXPENSE_LOCAL_PROVIDER
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{
    root.CCMV_EXPENSE_READ_SHADOW_FACTORY=api;
    const config=root.TRIP_CONFIG||{};
    const enabled=config.features?.expenseCanonicalReadShadow===true;
    const canonicalKey=root.STORAGE_CONFIG?.domains?.canonicalExpenses?.state;
    const stateKey=root.STORAGE_CONFIG?.domains?.expenseReadShadow?.state;
    if(enabled&&root.STORAGE?.local&&canonicalKey&&stateKey){
      const provider=root.CCMV_CANONICAL_EXPENSE_LOCAL||providerModule.createProvider({
        storage:root.STORAGE.local,key:canonicalKey,enabled:false
      });
      root.CCMV_CANONICAL_EXPENSE_LOCAL=provider;
      root.CCMV_EXPENSE_READ_SHADOW=api.createCoordinator({
        enabled,project:config.id?'VN':'NZ',
        tripId:config.id||config.storageNamespace,
        currency:config.currency?.code||'VND',
        parties:config.parties,provider,storage:root.STORAGE.local,
        canonicalKey,stateKey
      });
    }
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(adapter,calculator,providerModule){
  'use strict';
  const SCHEMA_VERSION=1;
  const CODES=Object.freeze([
    'CANONICAL_SNAPSHOT_MISSING','CANONICAL_READ_FAILURE','ACTIVE_COUNT_MISMATCH',
    'TOMBSTONE_COUNT_MISMATCH','EXPENSE_ID_MISMATCH','PARTY_MISMATCH',
    'AMOUNT_MISMATCH','SPLIT_MODE_MISMATCH','ALLOCATION_MISMATCH',
    'SETTLEMENT_MISMATCH','TIMESTAMP_MISMATCH','VERSION_MISMATCH',
    'ID_MAPPING_MISMATCH','CANONICAL_STALE','UNSUPPORTED_READ_STATE'
  ]);
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function freeze(value){
    if(!value||typeof value!=='object'||Object.isFrozen(value))return value;
    Object.values(value).forEach(freeze);return Object.freeze(value);
  }
  function sourceKey(record,project){
    if(project==='NZ')return record?.id?`NZ:${record.id}`:null;
    return record?.createdAt?`VN:${record.createdAt}`:null;
  }
  function allocationsMatch(expected,actual){
    return expected.length===actual.length&&expected.every((row,index)=>
      row.partyId===actual[index]?.partyId&&calculator.amountsMatch(row.amount,actual[index]?.amount,0)
    );
  }
  function createCoordinator(settings){
    const options=settings||{};
    const now=()=>String(typeof options.now==='function'?options.now():new Date().toISOString());
    const readPrior=()=>{
      try{
        const raw=options.storage?.get(options.stateKey,null);
        const parsed=raw===null?null:JSON.parse(raw);
        return parsed&&parsed.schemaVersion===SCHEMA_VERSION?parsed:null;
      }catch(error){return null;}
    };
    function persist(state){
      try{return options.storage?.writeJSON(options.stateKey,state)!==false;}
      catch(error){return false;}
    }
    function resultState(action,legacyCount,canonical,stateDiagnostics,prior){
      const healthy=stateDiagnostics.length===0;
      const state={
        schemaVersion:SCHEMA_VERSION,enabled:true,healthy,
        lastCheckedAt:now(),lastAction:action||'read',
        legacyActiveCount:legacyCount,
        canonicalActiveCount:canonical?.active?.length??0,
        canonicalTombstoneCount:canonical?.tombstones?.length??0,
        mismatchCount:stateDiagnostics.length,
        diagnostics:stateDiagnostics,
        consecutivePasses:healthy?Number(prior?.consecutivePasses||0)+1:0,
        consecutiveFailures:healthy?0:Number(prior?.consecutiveFailures||0)+1
      };
      persist(state);
      return freeze(clone({attempted:true,healthy,state}));
    }
    function observe(input){
      if(options.enabled!==true)return freeze({attempted:false,healthy:true,reason:'feature-disabled'});
      const action=input?.action||'read';
      const legacy=clone(Array.from(input?.legacyRecords||[]));
      const prior=readPrior();
      if(!Array.isArray(input?.legacyRecords)){
        return resultState(action,0,null,[{code:'UNSUPPORTED_READ_STATE',field:'legacyRecords'}],prior);
      }
      let raw;
      try{raw=options.storage.get(options.canonicalKey,null);}
      catch(error){
        return resultState(action,legacy.length,null,[{code:'CANONICAL_READ_FAILURE',message:error.message}],prior);
      }
      if(raw===null){
        return resultState(action,legacy.length,null,[{code:'CANONICAL_SNAPSHOT_MISSING'}],prior);
      }
      let canonical;
      try{canonical=options.provider.read();}
      catch(error){
        return resultState(action,legacy.length,null,[{code:'CANONICAL_READ_FAILURE',message:error.message}],prior);
      }
      if(!canonical||!Array.isArray(canonical.active)||!Array.isArray(canonical.tombstones)||!canonical.idMappings){
        return resultState(action,legacy.length,canonical,[{code:'UNSUPPORTED_READ_STATE',field:'canonicalSnapshot'}],prior);
      }
      if(canonical.status?.healthy===false){
        return resultState(action,legacy.length,canonical,[{code:'CANONICAL_READ_FAILURE',reason:canonical.status.disabledReason}],prior);
      }
      const diagnostics=[];
      if(canonical.active.length!==legacy.length){
        diagnostics.push({code:'ACTIVE_COUNT_MISMATCH',expected:legacy.length,actual:canonical.active.length});
      }
      const expectedTombstones=Math.max(0,Object.keys(canonical.idMappings).length-legacy.length);
      if(canonical.tombstones.length!==expectedTombstones){
        diagnostics.push({code:'TOMBSTONE_COUNT_MISMATCH',expected:expectedTombstones,actual:canonical.tombstones.length});
      }
      const byId=new Map(canonical.active.map(record=>[record.expenseId,record]));
      legacy.forEach((record,index)=>{
        const key=sourceKey(record,options.project);
        const id=key&&canonical.idMappings[key];
        if(!key||!id){
          diagnostics.push({code:'ID_MAPPING_MISMATCH',expenseIndex:index,sourceKey:key});
          return;
        }
        const actual=byId.get(id);
        if(!actual){
          diagnostics.push({code:'EXPENSE_ID_MISMATCH',expenseIndex:index,expenseId:id});
          return;
        }
        const expected=adapter.adapt(Object.assign({},record,{migrationExpenseId:id}),index,options);
        if(actual.expenseId!==id)diagnostics.push({code:'EXPENSE_ID_MISMATCH',expenseIndex:index,expected:id,actual:actual.expenseId});
        if(actual.payerPartyId!==expected.payerPartyId)diagnostics.push({code:'PARTY_MISMATCH',expenseIndex:index,expected:expected.payerPartyId,actual:actual.payerPartyId});
        if(!calculator.amountsMatch(actual.amount,expected.amount,0))diagnostics.push({code:'AMOUNT_MISMATCH',expenseIndex:index,expected:expected.amount,actual:actual.amount});
        if(actual.splitMode!==expected.splitMode)diagnostics.push({code:'SPLIT_MODE_MISMATCH',expenseIndex:index,expected:expected.splitMode,actual:actual.splitMode});
        if(!allocationsMatch(expected.allocations,actual.allocations||[]))diagnostics.push({code:'ALLOCATION_MISMATCH',expenseIndex:index,expected:expected.allocations,actual:actual.allocations||[]});
        if(actual.createdAt!==expected.createdAt||actual.updatedAt!==expected.updatedAt){
          diagnostics.push({code:'TIMESTAMP_MISMATCH',expenseIndex:index,expected:{createdAt:expected.createdAt,updatedAt:expected.updatedAt},actual:{createdAt:actual.createdAt,updatedAt:actual.updatedAt}});
        }
        if(record.version!=null&&actual.version!==record.version||!Number.isInteger(actual.version)||actual.version<1){
          diagnostics.push({code:'VERSION_MISMATCH',expenseIndex:index,expected:record.version??'>=1',actual:actual.version});
        }
      });
      const expectedSettlement=calculator.netSettlementPosition(
        legacy.map((record,index)=>adapter.adapt(Object.assign({},record,{migrationExpenseId:sourceKey(record,options.project)&&canonical.idMappings[sourceKey(record,options.project)]}),index,options)),
        options.parties.order
      );
      const actualSettlement=calculator.netSettlementPosition(canonical.active,options.parties.order);
      const settlementDifferences=[];
      new Set([...Object.keys(expectedSettlement),...Object.keys(actualSettlement)]).forEach(partyId=>{
        if(!calculator.amountsMatch(expectedSettlement[partyId]||0,actualSettlement[partyId]||0,0)){
          settlementDifferences.push({partyId,expected:expectedSettlement[partyId]||0,actual:actualSettlement[partyId]||0});
        }
      });
      if(settlementDifferences.length)diagnostics.push({code:'SETTLEMENT_MISMATCH',differences:settlementDifferences});
      const latestLegacy=Math.max(0,...legacy.map(record=>Date.parse(record.updatedAt||record.editedAt||record.createdAt||0)||0));
      const latestCanonical=Math.max(0,...canonical.active.map(record=>Date.parse(record.updatedAt||record.createdAt||0)||0));
      if(latestLegacy>latestCanonical)diagnostics.push({code:'CANONICAL_STALE',expectedAtLeast:new Date(latestLegacy).toISOString(),actual:new Date(latestCanonical).toISOString()});
      return resultState(action,legacy.length,canonical,diagnostics,prior);
    }
    function clearState(){return options.storage?.remove(options.stateKey)!==false;}
    function getState(){
      const state=readPrior();
      return state?freeze(clone(state)):null;
    }
    return freeze({observe,clearState,getState});
  }
  return freeze({SCHEMA_VERSION,CODES,createCoordinator});
});
