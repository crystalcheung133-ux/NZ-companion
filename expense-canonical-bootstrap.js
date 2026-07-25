/* Stage 3.2D/3.2E conditional canonical Expense validation wiring. */
(function(root){
  'use strict';
  const config=root.TRIP_CONFIG||{};
  const dual=config.features?.expenseCanonicalDualWrite===true;
  const shadow=config.features?.expenseCanonicalReadShadow===true;
  if(!dual&&!shadow)return;
  const files=[
    'expense-calculator.js','legacy-expense-adapter.js',
    'canonical-expense-repository.js','canonical-expense-core.js',
    'canonical-expense-local-provider.js'
  ];
  if(dual)files.push('expense-dual-write.js');
  if(shadow)files.push('expense-read-shadow.js');
  document.write(files.map(file=>`<script src="${file}?v=stage3-2e-1"><\/script>`).join(''));
})(globalThis);
