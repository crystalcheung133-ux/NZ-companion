/* Stage 3.2D Canonical Expense Core.
   Pure commands and invariants; no DOM, storage, Supabase, labels or lifecycle ownership. */
(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports?require('./expense-calculator.js'):root.CCMV_EXPENSE_CALCULATOR,
    typeof module==='object'&&module.exports?require('./canonical-expense-repository.js'):root.CCMV_CANONICAL_EXPENSE_REPOSITORY
  );
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.CCMV_CANONICAL_EXPENSE_CORE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(calculator,repository){
  'use strict';
  function freeze(value){
    if(!value||typeof value!=='object'||Object.isFrozen(value)) return value;
    Object.values(value).forEach(freeze);return Object.freeze(value);
  }
  function fail(code,field,message){
    const error=new Error(message||code);error.code=code;error.field=field||null;throw error;
  }
  function context(options){
    const input=options||{};
    if(input.lifecycleWritable!==true) fail('LIFECYCLE_NOT_WRITABLE','lifecycleWritable','Expense mutation is not writable');
    return input;
  }
  function validate(record,options){
    const settings=options||{};
    if(!record||typeof record!=='object') fail('CANONICAL_VALIDATION_FAILURE','expense','Expense is required');
    if(!record.expenseId) fail('CANONICAL_VALIDATION_FAILURE','expenseId','Stable expenseId is required');
    if(record.tripId!==settings.tripId) fail('CANONICAL_VALIDATION_FAILURE','tripId','Trip mismatch');
    if(record.currency!==settings.currency) fail('CANONICAL_VALIDATION_FAILURE','currency','Currency mismatch');
    if(!['equal','custom','personal'].includes(record.splitMode)) fail('CANONICAL_VALIDATION_FAILURE','splitMode','Unsupported splitMode');
    const partyIds=new Set(Object.keys(settings.parties&&settings.parties.identities||{}));
    if(!partyIds.has(record.payerPartyId)) fail('CANONICAL_VALIDATION_FAILURE','payerPartyId','Unknown payer Party');
    const allocations=repository.normalizeAllocations(record.allocations);
    if(!allocations.length) fail('CANONICAL_VALIDATION_FAILURE','allocations','Allocations are required');
    if(allocations.some(row=>!partyIds.has(row.partyId))) fail('CANONICAL_VALIDATION_FAILURE','allocations.partyId','Unknown allocation Party');
    if(!calculator.validateCustomAllocations(record.amount,allocations).valid) fail('CANONICAL_VALIDATION_FAILURE','allocations','Allocations do not balance');
    return allocations;
  }
  function shape(input,values){
    return {
      expenseId:values.expenseId,
      tripId:values.tripId,
      payerPartyId:values.payerPartyId,
      amount:calculator.normalizeAmount(values.amount),
      currency:values.currency,
      description:values.description??null,
      category:values.category??null,
      occurredAt:values.occurredAt??null,
      splitMode:values.splitMode,
      allocations:repository.normalizeAllocations(values.allocations),
      createdAt:values.createdAt??null,
      updatedAt:values.updatedAt??null,
      deletedAt:values.deletedAt??null,
      version:values.version,
      migration:freeze(Object.assign({},values.migration||{},input&&input.migration||{}))
    };
  }
  function create(input,options){
    const settings=context(options);
    const now=String(input.updatedAt||input.createdAt||settings.now||new Date().toISOString());
    const record=shape(input,Object.assign({},input,{
      createdAt:input.createdAt||now,updatedAt:now,deletedAt:null,version:1
    }));
    record.allocations=validate(record,settings);
    return freeze(record);
  }
  function update(existing,input,options){
    const settings=context(options);
    if(!existing||existing.deletedAt) fail('UNSUPPORTED_CANONICAL_TRANSITION','expense','Active Expense required for update');
    if(input.expenseId&&input.expenseId!==existing.expenseId) fail('CANONICAL_ID_MISMATCH','expenseId','expenseId is immutable');
    const next=shape(input,Object.assign({},existing,input,{
      expenseId:existing.expenseId,
      createdAt:existing.createdAt,
      updatedAt:String(input.updatedAt||settings.now||new Date().toISOString()),
      deletedAt:null,
      version:Number(existing.version||0)+1
    }));
    next.allocations=validate(next,settings);
    return freeze(next);
  }
  function remove(existing,options){
    const settings=context(options);
    if(!existing||existing.deletedAt) fail('UNSUPPORTED_CANONICAL_TRANSITION','expense','Active Expense required for delete');
    const now=String(settings.now||new Date().toISOString());
    const tombstone=shape(existing,Object.assign({},existing,{
      updatedAt:now,deletedAt:now,version:Number(existing.version||0)+1
    }));
    tombstone.allocations=validate(tombstone,settings);
    return freeze(tombstone);
  }
  return Object.freeze({create,update,delete:remove,validate});
});
