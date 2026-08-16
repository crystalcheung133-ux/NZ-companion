#!/bin/sh
set -u
node ci-tests/test-expense-save-safety.js
echo "EXPENSE SAVE SAFETY: PASS"

node ci-tests/test-expense-modal-scroll-reset.js
