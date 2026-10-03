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
run "RC25.7.24 AUDITED TIMELINE AUTHORITY" python ci-tests/test-rc25724-audited-timeline.py
run "RC25.7.25 EDITABLE SOURCE CONTRACT" python ci-tests/test-rc25725-editable-source-contract.py
run "RC25.7.27 SELECTOR FOREGROUND CORRECTION" python ci-tests/test-rc25727-selector-foreground.py
run "RC25.7.28 CROSS-DEVICE SYNC CONTRACT" python ci-tests/test-rc25728-cross-device-sync.py
run "RC25.7.29 BOOKING CARD DETAIL PARITY" node ci-tests/test-booking-card-detail-parity.js
run "RC25.7.30 BOOKING SAVE SYNC API" python ci-tests/test-rc25730-booking-sync-api-contract.py
run "RC25.7.31 BOOKING CROSS-DEVICE PUSH" node ci-tests/test-rc25731-booking-sync-push.js
run "RC25.7.32 BROWSER CLOUD ISOLATION" python ci-tests/test-rc25732-browser-isolation.py


run "RC25.7.34 LIVE FX SAVE" node ci-tests/test-rc25734-live-fx-save.js
run "RC25.7.36 BOOKING DISPLAY/EDIT FIELD PARITY" node ci-tests/test-rc25736-booking-display-edit-parity.js
run "RC25.7.37 BOOKING ROUND-TRIP PERSISTENCE" node ci-tests/test-rc25737-booking-roundtrip-persistence.js
run "RC25.7.38 SIMPLIFIED BOOKING + SHARED PLACE" node ci-tests/test-rc25738-simplified-booking-place-contract.js
run "RC25.7.39 FIELD SIMPLIFICATION" node ci-tests/test-rc25739-field-simplification-contract.js
run "RC25.7.40 SHARED PLACE + GUIDE/TIMELINE" node ci-tests/test-rc25740-shared-place.js
run "RC25.7.41 GUIDE DISPLAY/EDIT PARITY" node ci-tests/test-rc25741-guide-parity.js
run "CRASH REGRESSION CONTRACT" python ci-tests/test-crash-regression-contract.py
run "CF2 SYNC RECONCILE BEHAVIOUR" node ci-tests/test-cf2-sync-reconcile.js
run "CF2 CRASH BEHAVIOUR CONTRACT" python ci-tests/test-crash-cf2-contract.py
run "CF3 MOMENT SAVE BEHAVIOUR" node ci-tests/test-cf3-moment-save-behaviour.js
run "CF3 PHOTO RETRY BEHAVIOUR" node ci-tests/test-cf3-photo-retry-behaviour.js
run "CF3 SW ROUTE IDENTITY" node ci-tests/test-cf3-sw-route-identity.js
run "CF4 PHOTO FLUSH LIVE MERGE" node ci-tests/test-cf4-photo-flush-live-merge.js
run "CF4 REMOTE DELETE CONFLICT" node ci-tests/test-cf4-remote-delete-conflict.js
run "CF4 SW NAVIGATION WIRING" node ci-tests/test-cf4-sw-navigation-wiring.js
run "FR2 ATOMIC CRITICAL ASSETS" node ci-tests/test-fr2-atomic-critical-assets.js
run "FR2 FETCH WIRING" node ci-tests/test-fr2-fetch-wiring.js
run "CF4 SAVE SESSION LOCK" node ci-tests/test-cf4-save-session-lock.js
run "CF4.1 PRODUCTION WIRING" node ci-tests/test-cf41-production-wiring.js
run "RELEASE CHECKSUMS" sh ci-tests/test-checksums.sh

if [ "$failed" -eq 0 ]; then
  printf '\nNZ 25.7 SHARED-READY CI PASSED\n'
  exit 0
fi
printf '\nNZ 25.7 SHARED-READY CI FAILED\n' >&2
exit 1

