const fs=require('fs'),assert=require('assert');
const gate=fs.readFileSync('ci-tests/test-browser-release-smoke.py','utf8');
const runner=fs.readFileSync('ci-tests/run-browser.sh','utf8');
for(const token of [
 'studio_login(page)',
 "page.reload(wait_until='domcontentloaded')",
 '#tripStudioSelectorToggle',
 '#tripStudioModal.show',
 'assert_studio_closed_clean',
 'top_owner',
 'nav_visible',
 "active User Selector incorrectly opened traveller selector",
 "reload active User Selector incorrectly opened traveller selector",
 "'mobile-390x844'",
 "'desktop-1280x800'",
 "openAccommodationDetail('peppers-booking')",
 "trip-action-btn--email",
 "How to book / handoff",
 "phone-only Call action should not exist",
 "'experience' in types and 'rest' in types and 'transport' in types"
]) assert(gate.includes(token),`Browser smoke lost required portable coverage token: ${token}`);
assert(runner.includes('test-browser-release-smoke.py'),'Browser runner must execute canonical release smoke');
assert(gate.includes('BROWSER_BASE_URL'),'Browser smoke must support validating a deployed production URL');
assert(!runner.includes('|| true'),'Browser runner must never convert a failed browser test into PASS');
const workflow=fs.readFileSync('.github/workflows/browser-release-smoke.yml','utf8');
assert(workflow.includes('sh ci-tests/run-browser.sh'),'GitHub browser workflow must execute canonical browser runner');
assert(workflow.includes('playwright install --with-deps chromium'),'GitHub browser workflow must provision a real Chromium');
console.log('BROWSER GATE DEFINITION: PASS — portable Studio lifecycle, Booking allow-list and activity semantics are mandatory.');
