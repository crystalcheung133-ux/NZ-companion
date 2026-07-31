/* Stage 3.2B shared Expense Calculator.
   Pure arithmetic only. It is intentionally not connected to production UI. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.CCMV_EXPENSE_CALCULATOR=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function normalizeAmount(value){
    if(typeof value==='number') return Number.isFinite(value)?value:0;
    const cleaned=String(value==null?'':value).replace(/[^0-9.]/g,'');
    const amount=Number(cleaned);
    return Number.isFinite(amount)?amount:0;
  }
  function sumAmounts(values){
    return Array.from(values||[]).reduce((sum,value)=>sum+normalizeAmount(value),0);
  }
  function amountsMatch(left,right,tolerance){
    const allowed=Number.isFinite(Number(tolerance))?Math.abs(Number(tolerance)):0.01;
    return Math.abs(normalizeAmount(left)-normalizeAmount(right))<=allowed;
  }
  function expandEqualAllocation(amount,partyIds){
    const parties=Array.from(partyIds||[]).filter(Boolean);
    if(!parties.length) return [];
    const share=normalizeAmount(amount)/parties.length;
    return parties.map(partyId=>({partyId,amount:share}));
  }
  function automaticRemainder(total,usedValues){
    return normalizeAmount(total)-sumAmounts(usedValues);
  }
  function validateCustomAllocations(total,allocations,tolerance){
    const rows=Array.from(allocations||[]);
    const allocated=sumAmounts(rows.map(row=>row&&row.amount));
    const difference=normalizeAmount(total)-allocated;
    return Object.freeze({
      valid:rows.length>0&&rows.every(row=>!!row&&!!row.partyId)&&amountsMatch(total,allocated,tolerance),
      allocated,difference,tolerance:tolerance==null?0.01:Math.abs(Number(tolerance))
    });
  }
  function personalAllocation(amount,partyId){
    return partyId?[{partyId,amount:normalizeAmount(amount)}]:[];
  }
  function netSettlementPosition(expenses,partyIds){
    const positions=Object.fromEntries(Array.from(partyIds||[]).map(partyId=>[partyId,0]));
    Array.from(expenses||[]).filter(expense=>expense&&!expense.deletedAt).forEach(expense=>{
      const amount=normalizeAmount(expense.amount);
      if(!(expense.payerPartyId in positions)) positions[expense.payerPartyId]=0;
      positions[expense.payerPartyId]+=amount;
      Array.from(expense.allocations||[]).forEach(allocation=>{
        if(!(allocation.partyId in positions)) positions[allocation.partyId]=0;
        positions[allocation.partyId]-=normalizeAmount(allocation.amount);
      });
    });
    return positions;
  }
  function validateBalance(positions,tolerance){
    const total=sumAmounts(Object.values(positions||{}));
    return Object.freeze({valid:amountsMatch(total,0,tolerance),total});
  }
  return Object.freeze({
    normalizeAmount,sumAmounts,amountsMatch,expandEqualAllocation,
    validateCustomAllocations,automaticRemainder,personalAllocation,
    netSettlementPosition,validateBalance
  });
});
