/* Stage 3.2D legacy-first, feature-flagged canonical dual-write coordinator. */
(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports?require('./legacy-expense-adapter.js'):root.CCMV_LEGACY_EXPENSE_ADAPTER,
    typeof module==='object'&&module.exports?require('./canonical-expense-repository.js'):root.CCMV_CANONICAL_EXPENSE_REPOSITORY,
    typeof module==='object'&&module.exports?require('./canonical-expense-core.js'):root.CCMV_CANONICAL_EXPENSE_CORE,
    typeof module==='object'&&module.exports?require('./canonical-expense-local-provider.js'):root.CCMV_CANONICAL_EXPENSE_LOCAL_PROVIDER
  );
  if(typeof module==='object'&&module.exports) module.exports=api;
  else{
    root.CCMV_EXPENSE_DUAL_WRITE_FACTORY=api;
    const config=root.TRIP_CONFIG||{};
    const storageKey=root.STORAGE_CONFIG?.domains?.canonicalExpenses?.state;
    if(root.STORAGE?.local&&storageKey){
      const provider=api.createLocalProvider({
        storage:root.STORAGE.local,key:storageKey,
        enabled:config.features?.expenseCanonicalDualWrite===true
      });
      root.CCMV_CANONICAL_EXPENSE_LOCAL=provider;
      root.CCMV_EXPENSE_DUAL_WRITE=api.createDualWrite({
        enabled:config.features?.expenseCanonicalDualWrite===true,
        project:config.id?'VN':'NZ',
        tripId:config.id||config.storageNamespace,
        currency:config.currency?.code||'VND',
        parties:config.parties,
        provider
      });
    }
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(adapter,repository,core,providerModule){
  'use strict';
  const FATAL_CODES=new Set([
    'CANONICAL_WRITE_FAILURE','CANONICAL_READBACK_FAILURE','ID_MAPPING_FAILURE',
    'VERSION_MISMATCH','ALLOCATION_MISMATCH','PARTY_MISMATCH',
    'SETTLEMENT_MISMATCH','ACTIVE_TOMBSTONE_MISMATCH','STORAGE_CORRUPTION',
    'UNSUPPORTED_LEGACY_TRANSITION','REPOSITORY_MISMATCH','VALIDATION_FAILURE'
  ]);
  function createLocalProvider(options){return providerModule.createProvider(options);}
  function sourceKey(record,project){
    if(project==='NZ') return record&&record.id?`NZ:${record.id}`:null;
    return record&&record.createdAt?`VN:${record.createdAt}`:null;
  }
  function createDualWrite(settings){
    const options=settings||{};
    const provider=options.provider;
    const now=()=>String(typeof options.now==='function'?options.now():new Date().toISOString());
    let sessionHealthy=true;
    let sessionDiagnostic=null;
    function disabledResult(reason){return Object.freeze({attempted:false,success:true,reason});}
    function fail(code,details){
      const diagnostic=Object.assign({code,at:now()},details||{});
      sessionHealthy=false;sessionDiagnostic=diagnostic;
      try{provider?.markUnhealthy(diagnostic);}catch(error){}
      return Object.freeze({attempted:true,success:false,diagnostics:Object.freeze([diagnostic])});
    }
    function idFor(record,index,mappings,seen){
      const key=sourceKey(record,options.project);
      if(!key) throw Object.assign(new Error('Stable legacy source key unavailable'),{code:'ID_MAPPING_FAILURE'});
      if(seen.has(key)) throw Object.assign(new Error('Duplicate legacy source key'),{code:'ID_MAPPING_FAILURE'});
      seen.add(key);
      if(!mappings[key]){
        mappings[key]=options.project==='NZ'
          ?record.id
          :adapter.deterministicVietnamId(record,index);
      }
      if(!mappings[key]) throw Object.assign(new Error('Canonical id mapping unavailable'),{code:'ID_MAPPING_FAILURE'});
      return mappings[key];
    }
    function project(record,index,expenseId){
      const source=Object.assign({},record,{migrationExpenseId:expenseId});
      const projected=adapter.adapt(source,index,options);
      return Object.assign({},projected,{
        expenseId,
        migration:Object.assign({},projected.migration,{
          readOnly:false,stage:'3.2D',sourceKey:sourceKey(record,options.project)
        })
      });
    }
    function coreOptions(timestamp){
      return {
        lifecycleWritable:true,
        tripId:options.tripId,
        currency:options.currency,
        parties:options.parties,
        now:timestamp||now()
      };
    }
    function comparisons(legacyRecords,active,tombstones,idMappings,operation){
      const diagnostics=[];
      if(active.length!==legacyRecords.length){
        diagnostics.push({code:'ACTIVE_TOMBSTONE_MISMATCH',field:'activeCount',expected:legacyRecords.length,actual:active.length});
      }
      const canonicalById=new Map(active.map(record=>[record.expenseId,record]));
      const seen=new Set();
      legacyRecords.forEach((record,index)=>{
        const key=sourceKey(record,options.project);
        const id=key&&idMappings[key];
        if(!id||seen.has(key)){
          diagnostics.push({code:'ID_MAPPING_FAILURE',expenseIndex:index,sourceKey:key});
          return;
        }
        seen.add(key);
        const canonical=canonicalById.get(id);
        if(!canonical){
          diagnostics.push({code:'ACTIVE_TOMBSTONE_MISMATCH',expenseIndex:index,expenseId:id,expected:'active',actual:'missing'});
          return;
        }
        diagnostics.push(...repository.compareProjection(record,canonical,index,options));
        if(record.createdAt&&canonical.createdAt!==record.createdAt){
          diagnostics.push({code:'REPOSITORY_MISMATCH',expenseIndex:index,field:'createdAt',expected:record.createdAt,actual:canonical.createdAt});
        }
        const sourceUpdated=record.updatedAt||record.editedAt;
        if(sourceUpdated&&canonical.updatedAt!==sourceUpdated){
          diagnostics.push({code:'REPOSITORY_MISMATCH',expenseIndex:index,field:'updatedAt',expected:sourceUpdated,actual:canonical.updatedAt});
        }
      });
      diagnostics.push(...repository.compareSettlement(legacyRecords,active,options));
      const overlap=active.filter(record=>tombstones.some(tomb=>tomb.expenseId===record.expenseId));
      if(overlap.length) diagnostics.push({code:'ACTIVE_TOMBSTONE_MISMATCH',field:'overlap',expenseIds:overlap.map(x=>x.expenseId)});
      if(operation.expectedVersion!=null){
        const target=(operation.action==='delete'?tombstones:active).find(x=>x.expenseId===operation.expenseId);
        if(!target||target.version!==operation.expectedVersion){
          diagnostics.push({code:'VERSION_MISMATCH',expenseId:operation.expenseId,expected:operation.expectedVersion,actual:target?.version??null});
        }
      }
      return diagnostics;
    }
    function afterLegacyWrite(input){
      if(options.enabled!==true) return disabledResult('feature-disabled');
      if(!sessionHealthy) return disabledResult(sessionDiagnostic?.code||'session-unhealthy');
      if(!provider) return fail('CANONICAL_WRITE_FAILURE',{message:'Canonical provider unavailable'});
      try{
        const action=input&&input.action;
        if(!['create','update','delete'].includes(action)){
          return fail('UNSUPPORTED_LEGACY_TRANSITION',{action});
        }
        const legacyRecords=Array.from(input.legacyRecords||[]);
        const prior=provider.read();
        if(!prior.status.healthy) return fail(prior.status.disabledReason||'STORAGE_CORRUPTION',{diagnostics:prior.diagnostics});
        const mappings=Object.assign({},prior.idMappings);
        const activeById=new Map(prior.active.map(record=>[record.expenseId,record]));
        const tombstoneById=new Map(prior.tombstones.map(record=>[record.expenseId,record]));
        const seen=new Set();
        let targetId=null;
        let expectedVersion=null;
        const targetKey=sourceKey(input.previousRecord||legacyRecords[input.targetIndex],options.project);
        const nextActive=[];
        legacyRecords.forEach((legacy,index)=>{
          const id=idFor(legacy,index,mappings,seen);
          const key=sourceKey(legacy,options.project);
          if(key===targetKey||index===input.targetIndex&&action==='create') targetId=id;
          const projected=project(legacy,index,id);
          const existing=activeById.get(id);
          if(action==='update'&&id===targetId){
            let base=existing;
            if(!base&&input.previousRecord){
              base=core.create(project(input.previousRecord,index,id),coreOptions(input.previousRecord.updatedAt||input.previousRecord.editedAt||input.previousRecord.createdAt));
            }
            if(!base) throw Object.assign(new Error('Canonical update base unavailable'),{code:'UNSUPPORTED_LEGACY_TRANSITION'});
            const updated=core.update(base,projected,coreOptions(projected.updatedAt));
            expectedVersion=Number(base.version||0)+1;nextActive.push(updated);
          }else if(existing){
            nextActive.push(existing);
          }else{
            const created=core.create(projected,coreOptions(projected.updatedAt||projected.createdAt));
            nextActive.push(created);
            if(id===targetId) expectedVersion=1;
          }
        });
        if(action==='delete'){
          const deleted=input.previousRecord;
          const key=sourceKey(deleted,options.project);
          if(!key) throw Object.assign(new Error('Deleted source identity unavailable'),{code:'ID_MAPPING_FAILURE'});
          targetId=mappings[key]||idFor(deleted,input.targetIndex??0,mappings,new Set());
          let base=activeById.get(targetId);
          if(!base) base=core.create(project(deleted,input.targetIndex??0,targetId),coreOptions(deleted.updatedAt||deleted.editedAt||deleted.createdAt));
          const tombstone=core.delete(base,coreOptions(input.deletedAt||now()));
          tombstoneById.set(targetId,tombstone);
          expectedVersion=Number(base.version||0)+1;
        }else if(targetId){
          tombstoneById.delete(targetId);
        }
        if(!targetId) throw Object.assign(new Error('Operation target mapping unavailable'),{code:'ID_MAPPING_FAILURE'});
        const pending={
          active:nextActive,
          tombstones:[...tombstoneById.values()],
          idMappings:mappings,
          migration:{version:'3.2D',project:options.project},
          status:{enabled:true,healthy:true,disabledReason:null},
          lastValidation:{status:'pending',action,at:now()},
          diagnostics:prior.diagnostics||[]
        };
        const written=provider.writeSnapshot(pending);
        if(!written.ok) return fail(written.diagnostic?.code||'CANONICAL_WRITE_FAILURE',{message:written.diagnostic?.message});
        const readback=provider.read();
        if(!readback.status.healthy) return fail(readback.status.disabledReason||'CANONICAL_READBACK_FAILURE');
        const operation={action,expenseId:targetId,expectedVersion};
        const diagnostics=comparisons(legacyRecords,readback.active,readback.tombstones,readback.idMappings,operation);
        const fatal=diagnostics.filter(item=>FATAL_CODES.has(item.code));
        if(fatal.length){
          const primary=Object.assign({code:fatal[0].code,at:now(),allDiagnostics:diagnostics},fatal[0]);
          sessionHealthy=false;sessionDiagnostic=primary;provider.markUnhealthy(primary);
          return Object.freeze({attempted:true,success:false,diagnostics:Object.freeze(diagnostics)});
        }
        const completed=provider.writeSnapshot(Object.assign({},readback,{
          status:{enabled:true,healthy:true,disabledReason:null},
          lastValidation:{status:'passed',action,expenseId:targetId,at:now(),diagnosticCount:diagnostics.length},
          diagnostics
        }));
        if(!completed.ok) return fail(completed.diagnostic?.code||'CANONICAL_WRITE_FAILURE');
        return Object.freeze({attempted:true,success:true,expenseId:targetId,diagnostics:Object.freeze(diagnostics)});
      }catch(error){
        return fail(error.code||'CANONICAL_WRITE_FAILURE',{message:error.message});
      }
    }
    function reEnable(){
      if(options.enabled!==true) return false;
      const result=provider?.reEnable();sessionHealthy=!!result?.ok;sessionDiagnostic=result?.ok?null:result?.diagnostic;
      return sessionHealthy;
    }
    function getHealth(){
      return Object.freeze({enabled:options.enabled===true,healthy:sessionHealthy,diagnostic:sessionDiagnostic});
    }
    return Object.freeze({afterLegacyWrite,reEnable,getHealth});
  }
  return Object.freeze({createDualWrite,createLocalProvider,FATAL_CODES});
});
