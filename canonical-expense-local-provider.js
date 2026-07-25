/* Stage 3.2D trip-scoped canonical local provider.
   One configuration-owned key stores an atomic validation snapshot. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.CCMV_CANONICAL_EXPENSE_LOCAL_PROVIDER=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const MIGRATION_VERSION='3.2D';
  function freeze(value){
    if(!value||typeof value!=='object'||Object.isFrozen(value)) return value;
    Object.values(value).forEach(freeze);return Object.freeze(value);
  }
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function initial(enabled){
    return {
      schemaVersion:1,
      migration:{version:MIGRATION_VERSION},
      active:[],
      tombstones:[],
      idMappings:{},
      status:{enabled:!!enabled,healthy:true,disabledReason:null},
      lastValidation:null,
      diagnostics:[]
    };
  }
  function createProvider(options){
    const settings=options||{};
    const storage=settings.storage;
    const key=settings.key;
    let sessionFailure=null;
    if(!storage||!key) throw new Error('Canonical storage provider requires configured storage and key');
    function parse(){
      const raw=storage.get(key,null);
      if(raw===null) return {ok:true,state:initial(settings.enabled)};
      try{
        const value=JSON.parse(raw);
        if(!value||value.schemaVersion!==1||!Array.isArray(value.active)||!Array.isArray(value.tombstones)||!value.idMappings){
          throw new Error('Invalid canonical state shape');
        }
        return {ok:true,state:value};
      }catch(error){
        const diagnostic={code:'STORAGE_CORRUPTION',message:error.message};
        sessionFailure=diagnostic;
        const state=initial(settings.enabled);
        state.status.healthy=false;state.status.disabledReason='STORAGE_CORRUPTION';
        state.diagnostics.push(diagnostic);
        return {ok:false,state};
      }
    }
    function read(){
      const result=parse();
      if(sessionFailure&&result.ok){
        result.state.status.healthy=false;
        result.state.status.disabledReason=sessionFailure.code;
        result.state.diagnostics.push(sessionFailure);
      }
      return freeze(clone(result.state));
    }
    function commit(next){
      if(sessionFailure) return {ok:false,diagnostic:sessionFailure};
      const payload=clone(next);
      if(storage.writeJSON(key,payload)===false){
        sessionFailure={code:'CANONICAL_WRITE_FAILURE',message:'Canonical snapshot write failed'};
        return {ok:false,diagnostic:sessionFailure};
      }
      const verify=parse();
      if(!verify.ok||JSON.stringify(verify.state)!==JSON.stringify(payload)){
        sessionFailure={code:'CANONICAL_READBACK_FAILURE',message:'Canonical snapshot readback mismatch'};
        return {ok:false,diagnostic:sessionFailure};
      }
      return {ok:true,state:freeze(clone(verify.state))};
    }
    function writeSnapshot(values){
      const current=read();
      if(!current.status.healthy) return {ok:false,diagnostic:current.diagnostics[current.diagnostics.length-1]};
      const next={
        schemaVersion:1,
        migration:Object.assign({version:MIGRATION_VERSION},values.migration||current.migration),
        active:Array.from(values.active||[]),
        tombstones:Array.from(values.tombstones||[]),
        idMappings:Object.assign({},values.idMappings||{}),
        status:Object.assign({},current.status,values.status||{}),
        lastValidation:values.lastValidation??null,
        diagnostics:Array.from(values.diagnostics||[])
      };
      return commit(next);
    }
    function markUnhealthy(diagnostic){
      sessionFailure=diagnostic||{code:'CANONICAL_WRITE_FAILURE'};
      const parsed=parse();
      if(!parsed.ok) return {ok:false,diagnostic:sessionFailure};
      const next=parsed.state;
      next.status={enabled:true,healthy:false,disabledReason:sessionFailure.code};
      next.diagnostics=(next.diagnostics||[]).concat([sessionFailure]);
      const saved=storage.writeJSON(key,next)!==false;
      return {ok:saved,state:freeze(clone(next)),diagnostic:sessionFailure};
    }
    function reEnable(){
      sessionFailure=null;
      const parsed=parse();
      if(!parsed.ok) return {ok:false,diagnostic:parsed.state.diagnostics[0]};
      parsed.state.status={enabled:true,healthy:true,disabledReason:null};
      return commit(parsed.state);
    }
    function clearAll(){sessionFailure=null;return storage.remove(key)!==false;}
    return Object.freeze({read,writeSnapshot,markUnhealthy,reEnable,clearAll,getKey:()=>key});
  }
  return Object.freeze({MIGRATION_VERSION,createProvider});
});
