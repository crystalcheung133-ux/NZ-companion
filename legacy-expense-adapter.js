/* Stage 3.2B read-only legacy Expense adapters.
   No storage, DOM, network, repository or writer dependency. */
(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./expense-calculator.js'):root.CCMV_EXPENSE_CALCULATOR);
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.CCMV_LEGACY_EXPENSE_ADAPTER=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(calculator){
  'use strict';
  function aliasMap(parties){
    const map={};
    Object.values(parties&&parties.identities||{}).forEach(party=>{
      [party.partyId].concat(party.legacyAliases||[]).forEach(alias=>{map[String(alias).toLowerCase()]=party.partyId;});
    });
    return map;
  }
  function resolveParty(value,parties,diagnostics,field){
    const partyId=aliasMap(parties)[String(value||'').toLowerCase()]||null;
    if(!partyId) diagnostics.push({code:'UNRESOLVED_PARTY_ALIAS',field,value:value??null});
    return partyId;
  }
  function stableHash(value){
    let hash=2166136261;
    for(const char of value){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}
    return (hash>>>0).toString(16).padStart(8,'0');
  }
  function deterministicVietnamId(record,index){
    const source=JSON.stringify({
      index,createdAt:record&&record.createdAt||null,item:record&&record.item||null,
      total:record&&record.total||null,paidBy:record&&record.paidBy||null,
      type:record&&record.type||null,split:record&&record.split||null
    });
    return `vn-expense-migration-${stableHash(source)}`;
  }
  function adapt(record,index,options){
    const source=record||{};
    const settings=options||{};
    const diagnostics=[];
    const parties=settings.parties||{};
    const project=settings.project==='VN'?'VN':'NZ';
    const amount=calculator.normalizeAmount(source.total);
    const payerPartyId=resolveParty(source.paidBy,parties,diagnostics,'paidBy');
    const personal=source.type==='personal';
    const splitMode=personal?'personal':source.splitMode==='custom'?'custom':'equal';
    let allocations=[];
    if(personal){
      const consumer=source.consumedBy||(source.split||[])[0]||source.paidBy;
      allocations=calculator.personalAllocation(amount,resolveParty(consumer,parties,diagnostics,'consumedBy'));
    }else if(splitMode==='custom'&&source.shares&&typeof source.shares==='object'){
      allocations=Object.entries(source.shares).map(([alias,value])=>({
        partyId:resolveParty(alias,parties,diagnostics,'shares'),amount:calculator.normalizeAmount(value)
      }));
    }else{
      const aliases=source.split&&source.split.length?source.split:[source.paidBy];
      allocations=calculator.expandEqualAllocation(amount,aliases.map(alias=>resolveParty(alias,parties,diagnostics,'split')));
      if(!source.splitMode) diagnostics.push({code:'LEGACY_EQUAL_FALLBACK',field:'splitMode'});
    }
    if(project==='VN'){
      if(source.category==null) diagnostics.push({code:'SOURCE_FACT_MISSING',field:'category'});
      if(source.occurredAt==null) diagnostics.push({code:'SOURCE_FACT_MISSING',field:'occurredAt'});
      if(source.version==null) diagnostics.push({code:'SOURCE_FACT_MISSING',field:'version'});
    }
    if(project==='NZ'&&!source.id) diagnostics.push({code:'SOURCE_FACT_MISSING',field:'expenseId'});
    const expenseId=project==='VN'
      ?(source.migrationExpenseId||deterministicVietnamId(source,index||0))
      :(source.id||null);
    return Object.freeze({
      expenseId,
      tripId:settings.tripId||null,
      payerPartyId,
      amount,
      currency:settings.currency||null,
      category:source.category??null,
      description:source.details??source.item??null,
      occurredAt:source.occurredAt??null,
      allocations:Object.freeze(allocations.map(row=>Object.freeze(row))),
      splitMode,
      createdAt:source.createdAt??null,
      updatedAt:source.updatedAt??source.editedAt??source.createdAt??null,
      deletedAt:source.deletedAt??null,
      version:source.version??null,
      migration:Object.freeze({
        source:`${project}-legacy-expense`,
        readOnly:true,
        idStrategy:project==='VN'?'deterministic-source-fingerprint':'preserved-source-id',
        diagnostics:Object.freeze(diagnostics.map(item=>Object.freeze(item)))
      })
    });
  }
  function adaptList(records,options){
    return Array.from(records||[]).map((record,index)=>adapt(record,index,options));
  }
  return Object.freeze({adapt,adaptList,deterministicVietnamId});
});
