const fs=require('fs'),assert=require('assert');
const trip=fs.readFileSync('trip-config.js','utf8'),core=fs.readFileSync('core-runtime.js','utf8');
assert(trip.includes("order: Object.freeze(['lee','fowlers','yau'])"));
assert(core.includes("if(selectable.length===1)"));
assert(core.includes("identitySelectionRequired=true"));
assert(core.includes("renderFriendChoices(); requestAnimationFrame(()=>modal.classList.add('show'))"));
console.log('STAGE 1 BACKWARD COMPAT CONTRACT: PASS');