/* Stage 3.2C Canonical Expense Repository and dual-read validation.
   Validation-only: no legacy writer, storage, Supabase, DOM or UI dependency. */
(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports?require('./expense-calculator.js'):root.CCMV_EXPENSE_CALCULATOR,
    typeof module==='object'&&module.exports?require('./legacy-expense-adapter.js'):root.CCMV_LEGACY_EXPENSE_ADAPTER
  );
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.CCMV_CANONICAL_EXPENSE_REPOSITORY=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(calculator,adapter){
  'use strict';
  const CANONICAL_FIELDS=Object.freeze([
    'expenseId','tripId','payerPartyId','amount','currency','description','category',
    'occurredAt','splitMode','allocations','createdAt','updatedAt','deletedAt',
    'version','migration'
  ]);
  const LEGACY_FIELDS=new Set([
    'id','migrationExpenseId','item','details','category','total','paidBy','type',
    'split','splitMode','shares','consumedBy','createdAt','updatedAt','editedAt',
    'deletedAt','version','occurredAt'
  ]);
  function deepFreeze(value){
    if(!value||typeof value!=='object'||Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }
  function diagnostic(code,index,details){
    return deepFreeze(Object.assign({code,expenseIndex:index},details||{}));
  }
  function partyMap(parties){
    const byAlias={};
    const byId={};
    Object.values(parties&&parties.identities||{}).forEach(party=>{
      byId[party.partyId]=party;
      [party.partyId].concat(party.legacyAliases||[]).forEach(alias=>{
        byAlias[String(alias).toLowerCase()]=party.partyId;
      });
    });
    return {byAlias,byId};
  }
  function resolveParty(value,parties){
    return partyMap(parties).byAlias[String(value||'').toLowerCase()]||null;
  }
  function normalizeAllocations(allocations){
    return Array.from(allocations||[]).map(row=>deepFreeze({
      partyId:row&&row.partyId||null,
      amount:calculator.normalizeAmount(row&&row.amount)
    }));
  }
  function normalizeCanonicalExpense(expense){
    return deepFreeze({
      expenseId:expense.expenseId,
      tripId:expense.tripId,
      payerPartyId:expense.payerPartyId,
      amount:expense.amount,
      currency:expense.currency,
      description:expense.description,
      category:expense.category,
      occurredAt:expense.occurredAt,
      splitMode:expense.splitMode,
      allocations:normalizeAllocations(expense.allocations),
      createdAt:expense.createdAt,
      updatedAt:expense.updatedAt,
      deletedAt:expense.deletedAt,
      version:expense.version,
      migration:expense.migration
    });
  }
  function expectedLegacy(record,options){
    const source=record||{};
    const amount=calculator.normalizeAmount(source.total);
    const payerPartyId=resolveParty(source.paidBy,options.parties);
    const personal=source.type==='personal';
    const splitMode=personal?'personal':source.splitMode==='custom'?'custom':'equal';
    let allocations;
    if(personal){
      allocations=calculator.personalAllocation(
        amount,
        resolveParty(source.consumedBy||(source.split||[])[0]||source.paidBy,options.parties)
      );
    }else if(splitMode==='custom'&&source.shares&&typeof source.shares==='object'){
      allocations=Object.entries(source.shares).map(([alias,value])=>({
        partyId:resolveParty(alias,options.parties),amount:calculator.normalizeAmount(value)
      }));
    }else{
      const aliases=source.split&&source.split.length?source.split:[source.paidBy];
      allocations=calculator.expandEqualAllocation(amount,aliases.map(alias=>resolveParty(alias,options.parties)));
    }
    return {
      payerPartyId,amount,splitMode,allocations:normalizeAllocations(allocations),
      description:source.details??source.item??null,
      category:source.category??null,
      deletedAt:source.deletedAt??null
    };
  }
  function validateCanonical(expense,index,options){
    const diagnostics=[];
    const keys=Object.keys(expense||{});
    const extra=keys.filter(key=>!CANONICAL_FIELDS.includes(key));
    const missing=CANONICAL_FIELDS.filter(key=>!keys.includes(key));
    if(extra.length||missing.length) diagnostics.push(diagnostic('VALIDATION_FAILURE',index,{field:'canonicalFields',extra,missing}));
    if(!expense||typeof expense!=='object') return diagnostics.concat(diagnostic('VALIDATION_FAILURE',index,{field:'expense',reason:'not-object'}));
    if(!expense.expenseId) diagnostics.push(diagnostic('VALIDATION_FAILURE',index,{field:'expenseId',reason:'missing'}));
    if(expense.tripId!==options.tripId) diagnostics.push(diagnostic('VALIDATION_FAILURE',index,{field:'tripId',expected:options.tripId,actual:expense.tripId}));
    if(expense.currency!==options.currency) diagnostics.push(diagnostic('VALIDATION_FAILURE',index,{field:'currency',expected:options.currency,actual:expense.currency}));
    const directory=partyMap(options.parties).byId;
    if(!directory[expense.payerPartyId]) diagnostics.push(diagnostic('VALIDATION_FAILURE',index,{field:'payerPartyId',actual:expense.payerPartyId}));
    if(!['equal','custom','personal'].includes(expense.splitMode)) diagnostics.push(diagnostic('VALIDATION_FAILURE',index,{field:'splitMode',actual:expense.splitMode}));
    if(!Array.isArray(expense.allocations)||!expense.allocations.length){
      diagnostics.push(diagnostic('VALIDATION_FAILURE',index,{field:'allocations',reason:'empty'}));
    }else{
      expense.allocations.forEach((row,allocationIndex)=>{
        if(!directory[row.partyId]) diagnostics.push(diagnostic('VALIDATION_FAILURE',index,{field:'allocations.partyId',allocationIndex,actual:row.partyId}));
        if(!Number.isFinite(row.amount)) diagnostics.push(diagnostic('VALIDATION_FAILURE',index,{field:'allocations.amount',allocationIndex,actual:row.amount}));
      });
      const allocationCheck=calculator.validateCustomAllocations(expense.amount,expense.allocations);
      if(!allocationCheck.valid) diagnostics.push(diagnostic('VALIDATION_FAILURE',index,{field:'allocations',reason:'unbalanced',difference:allocationCheck.difference}));
    }
    return diagnostics;
  }
  function allocationsEqual(expected,actual){
    if(expected.length!==actual.length) return false;
    return expected.every((row,index)=>row.partyId===actual[index].partyId&&calculator.amountsMatch(row.amount,actual[index].amount,0));
  }
  function compareProjection(record,canonical,index,options){
    const expected=expectedLegacy(record,options);
    const diagnostics=[];
    if(expected.payerPartyId!==canonical.payerPartyId){
      diagnostics.push(diagnostic('PARTY_MISMATCH',index,{field:'payerPartyId',expected:expected.payerPartyId,actual:canonical.payerPartyId}));
    }
    if(!allocationsEqual(expected.allocations,canonical.allocations||[])){
      diagnostics.push(diagnostic('ALLOCATION_MISMATCH',index,{expected:expected.allocations,actual:canonical.allocations||[]}));
    }
    for(const field of ['amount','description','category','splitMode','deletedAt']){
      if(expected[field]!==canonical[field]){
        diagnostics.push(diagnostic('REPOSITORY_MISMATCH',index,{field,expected:expected[field],actual:canonical[field]}));
      }
    }
    Object.keys(record||{}).filter(key=>!LEGACY_FIELDS.has(key)).forEach(field=>{
      diagnostics.push(diagnostic('UNSUPPORTED_LEGACY_FIELD',index,{field,value:record[field]}));
    });
    return diagnostics;
  }
  function legacySettlement(records,options){
    const canonicalLike=Array.from(records||[]).map(record=>expectedLegacy(record,options));
    return calculator.netSettlementPosition(canonicalLike,options.parties.order);
  }
  function compareSettlement(records,canonicalRecords,options){
    const expected=legacySettlement(records,options);
    const actual=calculator.netSettlementPosition(canonicalRecords,options.parties.order);
    const keys=new Set([...Object.keys(expected),...Object.keys(actual)]);
    const differences=[];
    keys.forEach(partyId=>{
      if(!calculator.amountsMatch(expected[partyId]||0,actual[partyId]||0,0)){
        differences.push({partyId,expected:expected[partyId]||0,actual:actual[partyId]||0});
      }
    });
    return differences.length?[diagnostic('SETTLEMENT_MISMATCH',null,{differences})]:[];
  }
  function createRepository(settings){
    const options=deepFreeze(Object.assign({},settings||{}));
    let snapshot=deepFreeze({records:[],diagnostics:[],comparison:{equivalent:true}});
    function loadForValidation(legacyRecords){
      const input=Array.from(legacyRecords||[]);
      const canonical=adapter.adaptList(input,options).map(normalizeCanonicalExpense);
      const diagnostics=[];
      canonical.forEach((expense,index)=>{
        diagnostics.push(...expense.migration.diagnostics);
        diagnostics.push(...validateCanonical(expense,index,options));
        diagnostics.push(...compareProjection(input[index],expense,index,options));
      });
      diagnostics.push(...compareSettlement(input,canonical,options));
      const mismatchCodes=new Set(['REPOSITORY_MISMATCH','ALLOCATION_MISMATCH','PARTY_MISMATCH','SETTLEMENT_MISMATCH','VALIDATION_FAILURE']);
      snapshot=deepFreeze({
        records:canonical.slice(),
        diagnostics:diagnostics.slice(),
        comparison:{equivalent:!diagnostics.some(item=>mismatchCodes.has(item.code))}
      });
      return snapshot;
    }
    function getAll(){return snapshot.records;}
    function getById(expenseId){return snapshot.records.find(expense=>expense.expenseId===expenseId)||null;}
    function getDiagnostics(){return snapshot.diagnostics;}
    return Object.freeze({loadForValidation,getAll,getById,getDiagnostics});
  }
  return Object.freeze({
    CANONICAL_FIELDS,createRepository,resolveParty,normalizeAllocations,
    validateCanonical,compareProjection,compareSettlement
  });
});
