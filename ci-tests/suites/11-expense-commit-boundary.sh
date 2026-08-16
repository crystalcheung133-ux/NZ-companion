#!/bin/sh
set -u
node ci-tests/test-expense-save-commit-boundary.js
echo "EXPENSE COMMIT BOUNDARY: PASS"
