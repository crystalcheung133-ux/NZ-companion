#!/bin/sh
set -u
failed=0
run(){ printf '\n== %s ==\n' "$1"; shift; "$@" || failed=1; }
run "SYNTAX" sh ci-tests/test-syntax.sh
run "HTML STRUCTURE" sh ci-tests/test-html-structure.sh
run "ENGINE 25.6 MIGRATION" node ci-tests/test-engine-25-6-migration.js
run "ENTITY INTEGRITY" node ci-tests/test-entity-integrity.js
run "TIMELINE INTEGRITY" node ci-tests/test-timeline-integrity.js
run "RUNTIME INTEGRITY" node ci-tests/test-runtime-integrity.js
run "BOOKING PERSISTENCE" node ci-tests/test-runtime-booking-persistence.js
run "INDEXEDDB LIFECYCLE" node ci-tests/test-runtime-indexeddb-lifecycle.js
run "RESET GENERATION" node ci-tests/test-runtime-reset-generation.js
run "RESET SEQUENCE" node ci-tests/test-runtime-reset-sequence.js
run "BOOKING / EXPENSE LINKAGE" node ci-tests/test-booking-expense-linkage.js
run "INLINE BOOKING FROM EXPENSE" node ci-tests/test-inline-booking-from-expense.js
run "EXPENSE NOTIFICATIONS" node ci-tests/test-expense-notifications.js
run "EXPENSE CURRENCY TOGGLE" node ci-tests/test-expense-currency-toggle.js
run "ANALYTICS V1.2" node ci-tests/test-analytics-v1.js
run "ANALYTICS PERMISSIONS" node ci-tests/test-analytics-permission-contract.js
run "BROWSER GATE DEFINITION" node ci-tests/test-browser-gate-definition.js
run "DESTRUCTIVE ACTION SECURITY" node ci-tests/test-destructive-action-security.js
run "SOLO PARTY" node ci-tests/test-stage1-solo-party.js
run "BACKWARD COMPAT" node ci-tests/test-stage1-backward-compat.js
run "CANONICAL STUDIO + EXPENSE DEEP-LINK" node ci-tests/test-canonical-studio-expense-deeplink.js
run "CANONICAL STUDIO VISUAL CONTRACT 25.6.2" node ci-tests/test-studio-visual-contract-2562.js
run "SHARED-FACING CONTENT" node ci-tests/test-shared-facing-content.js
run "RC25.7.12 NAVIGATION + FULL DRIVE + BROWSER BOOTSTRAP" python ci-tests/test-rc25712-navigation-drive-browser-bootstrap.py
run "RC25.7.13 DOC ORIGIN + EDIT + DAY IDENTITY" python ci-tests/test-rc25713-doc-origin-edit-day-identity.py
run "RC25.7.14 RENTAL ATTACHMENT + STUDIO REENTRY" python ci-tests/test-rc25714-rental-attachment-studio-reentry.py
run "RC25.7.15 SHARED BOOKING LINKS" python ci-tests/test-rc25715-shared-booking-links.py
run "DOCUMENTS PAGE CONTRACT" python ci-tests/test-documents-page-contract.py
run "DOCUMENTS CI WIRING" python ci-tests/test-documents-ci-wiring.py
run "DOCUMENTS JS SCOPE" python ci-tests/test-documents-js-scope.py
run "CALM TIMELINE CONTRACT" python ci-tests/test-calm-timeline-contract.py
run "CALM DOCUMENTS UI + SYNC" python ci-tests/test-documents-calm-ui-sync.py
run "DOCUMENT LINKS + METADATA SYNC + LUXE" python ci-tests/test-documents-links-metadata-sync-luxe.py
run "HANDOFF + FOREGROUND + RELEASE IDENTITY" python ci-tests/test-handoff-layer-release-gate.py
run "RC25.7.11 MODAL + RETURN + DERIVED DAY" python ci-tests/test-rc25711-modal-return-derived-day.py
run "RC25.7.21 PAYMENT ROUNDTRIP CONTRACT" python ci-tests/test-rc25721-payment-roundtrip.py


if [ "$failed" -eq 0 ]; then
  printf '\nNZ 25.7 SHARED-READY CI PASSED\n'
  exit 0
fi
printf '\nNZ 25.7 SHARED-READY CI FAILED\n' >&2
exit 1
