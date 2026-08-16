const fs=require('fs'),assert=require('assert');
const gate=fs.readFileSync('ci-tests/test-browser-release-smoke.py','utf8');
const runner=fs.readFileSync('ci-tests/run-browser.sh','utf8');
for(const token of [
 'studio_login(page)',
 "page.reload(wait_until='domcontentloaded')",
 '#tripStudioSelectorToggle',
 '#tripStudioModal.show',
 'assert_studio_closed_clean',
 '#pizza4ps',
 '.timeline-action--trip',
 '.timeline-action--guide',
 "has_text='Booking'",
 'tz>gz',
 'top_owner',
 'nav_visible',
 "active User Selector incorrectly opened traveller selector",
 "reload active User Selector incorrectly opened traveller selector",
 "'mobile-390x844'",
 "'desktop-1280x800'",
 "window.GUIDE_MODAL_ORIGIN",
 "Timeline-origin Guide remained open after Booking Close",
 "Pizza 4P’s Hai Bà Trưng",
 "openBookingCategoryCard('Restaurants')",
 "openBookingCategoryCard('Spa')",
 "rendered Restaurants rolled back Pizza branch",
 "Mộc Healing did not render at 14:20",
 "Pizza says online but rendered no Book Online action",
 "Mộc Healing email action missing",
 "Mộc Healing incorrectly exposes WhatsApp",
 "phone-only Call action should not exist"
]) assert(gate.includes(token),`Browser smoke lost required coverage token: ${token}`);
assert(runner.includes('test-browser-release-smoke.py'),'Browser runner must execute the canonical release smoke');
assert(gate.includes('BROWSER_BASE_URL'),'Browser smoke must support validating a deployed production URL');
assert(!runner.includes('|| true'),'Browser runner must never convert a failed browser test into PASS');
const workflow=fs.readFileSync('.github/workflows/browser-release-smoke.yml','utf8');
assert(workflow.includes('sh ci-tests/run-browser.sh'),'GitHub browser workflow must execute canonical browser runner');
assert(workflow.includes('playwright install --with-deps chromium'),'GitHub browser workflow must provision a real Chromium');
console.log('BROWSER GATE DEFINITION: PASS — Studio lifecycle/reload, Booking foreground, Guide→Booking stacking and nav visibility are mandatory.');
