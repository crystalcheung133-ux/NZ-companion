/* party-render-runtime.js — Portability Stage compatibility shim.

   Everywhere else in the engine, party identity already flows from
   TRIP_CONFIG.participants (FRIEND_IDENTITY, FRIEND_ORDER, DEFAULT_FRIEND,
   renderFriendChoices(), updateFriendLabels(), admin identity — see
   core-runtime.js / expenses.js / moments-compat.js / trip-config.js).

   The one place that was still authored as static per-party markup is the
   "Paid by" / "Consumed by" <select> options and the expense split-picker
   checkboxes: 3 hardcoded <option>/checkbox elements per control, one per
   legacy party (lee/fowlers/yau). Everything else adapts to config
   automatically; these controls would not, and would either break or
   silently keep showing the NZ trio for a different trip's participant list.

   GUARDED NO-OP: if the active config's participant keys are exactly the
   legacy ['lee','fowlers','yau'] set (i.e. current NZ production), this
   module does nothing at all, synchronously and unconditionally — current
   markup, DOM structure and behaviour are untouched. It only regenerates
   these controls when the config supplies a different participant list. */
(function(root){
  'use strict';

  function ready(fn){
    if (typeof document === 'undefined') return;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  const LEGACY_ORDER = ['lee','fowlers','yau'];

  function sameAsLegacy(order){
    return Array.isArray(order) && order.length===LEGACY_ORDER.length && order.every((k,i)=>k===LEGACY_ORDER[i]);
  }

  function labelFor(identities, key){
    const id = identities[key] || {};
    const code = id.code || String(key).slice(0,3).toUpperCase();
    const name = id.name || key;
    return code + ' · ' + name;
  }

  function run(){
    const cfg = root.TRIP_CONFIG;
    if (!cfg || !cfg.participants || !Array.isArray(cfg.participants.order)) return;
    const order = cfg.participants.order;
    if (sameAsLegacy(order)) return; // current NZ production: no-op
    const identities = cfg.participants.identities || {};

    // 1. Party <select> pickers — any <select> whose full option-value set
    //    is exactly the legacy trio, in any order, is treated as a party
    //    picker and regenerated from the active config.
    document.querySelectorAll('select').forEach(function(select){
      const values = Array.from(select.options || []).map(function(o){ return o.value; });
      if (values.length !== LEGACY_ORDER.length) return;
      if (!LEGACY_ORDER.every(function(k){ return values.indexOf(k) !== -1; })) return;
      const previousIndex = values.indexOf(select.value);
      select.innerHTML = order.map(function(key, i){
        const selected = (previousIndex !== -1 ? i === previousIndex : i === 0) ? ' selected' : '';
        return '<option value="' + key + '"' + selected + '>' + labelFor(identities, key) + '</option>';
      }).join('');
    });

    // 2. Split-picker checkbox groups — containers whose data-split
    //    checkboxes cover exactly the legacy trio.
    const containers = new Set();
    document.querySelectorAll('input[data-split]').forEach(function(input){
      const label = input.closest('label');
      const container = label && label.parentElement;
      if (container) containers.add(container);
    });
    containers.forEach(function(container){
      const inputs = Array.from(container.querySelectorAll('input[data-split]'));
      const values = inputs.map(function(i){ return i.value; });
      if (values.length !== LEGACY_ORDER.length) return;
      if (!LEGACY_ORDER.every(function(k){ return values.indexOf(k) !== -1; })) return;
      const onchange = inputs[0].getAttribute('onchange') || '';
      container.innerHTML = order.map(function(key){
        return '<label><input checked data-split type="checkbox" value="' + key + '"' +
          (onchange ? ' onchange="' + onchange + '"' : '') + '/><span>' + labelFor(identities, key) + '</span></label>';
      }).join('');
    });
  }

  ready(run);
  root.__partyRenderRuntimeRun = run; // exposed for the regression harness
})(globalThis);
