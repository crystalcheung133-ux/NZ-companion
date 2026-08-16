#!/bin/sh
set -u
node ci-tests/test-destructive-action-security.js
echo "DESTRUCTIVE ACTION SECURITY: PASS"
