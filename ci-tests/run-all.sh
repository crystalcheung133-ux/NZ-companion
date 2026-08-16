#!/bin/sh
set -u
failed=0
run(){ echo "== $1 =="; shift; "$@" || failed=1; echo ""; }
run "FOUNDATION" sh ci-tests/suites/01-foundation.sh
run "DATA INTEGRITY" sh ci-tests/suites/02-data-integrity.sh
run "VN PRODUCT CONTRACTS" sh ci-tests/suites/03-product-contracts.sh
run "ANALYTICS" sh ci-tests/suites/04-analytics.sh
run "PORTABILITY" sh ci-tests/suites/05-portability.sh
run "RUNTIME RELIABILITY" sh ci-tests/suites/06-runtime-reliability.sh
run "GENERICITY" sh ci-tests/suites/07-genericity.sh
run "BOOKING / EXPENSE" sh ci-tests/suites/08-booking-expense.sh
run "EXPENSE SAVE SAFETY" sh ci-tests/suites/10-expense-save-safety.sh
run "EXPENSE COMMIT BOUNDARY" sh ci-tests/suites/11-expense-commit-boundary.sh
run "RELEASE" sh ci-tests/suites/09-release.sh
run "STUDIO POPUP WORKSPACE" node ci-tests/test-studio-popup-workspace-contract.js styles.css admin.js
run "PRESENTATION SHELL OWNERSHIP" node ci-tests/test-presentation-shell-ownership.js styles.css
run "PRESENTATION SHELL INTERACTION" node ci-tests/test-presentation-shell-interaction.js styles.css admin.js
run "RELEASE HYGIENE" node ci-tests/test-release-hygiene.js .
run "BOOKING / GUIDE MODAL STACKING" node ci-tests/test-booking-guide-modal-stacking.js styles.css
run "TRIP / GUIDE SHELL CONSOLIDATION" node ci-tests/test-trip-guide-shell-consolidation.js styles.css
run "STUDIO HOME PREVIEW BOUNDS" node ci-tests/test-studio-home-preview-fit.js styles.css admin.js
run "STUDIO LIFECYCLE CONSOLIDATION" node ci-tests/test-studio-lifecycle-consolidation.js
run "STUDIO HEADER BADGE" node ci-tests/test-studio-header-badge.js styles.css admin.js
run "VN HEADER THEME" node ci-tests/test-vn-header-theme.js styles.css
run "CANONICAL STUDIO + EXPENSE DEEP-LINK" node ci-tests/test-canonical-studio-expense-deeplink.js
run "CANONICAL STUDIO VISUAL CONTRACT 25.6.2" node ci-tests/test-studio-visual-contract-2562.js
[ "$failed" -eq 0 ] || { echo "MASTER CI SUITE FAILED"; exit 1; }
echo "MASTER CI SUITE PASSED"

