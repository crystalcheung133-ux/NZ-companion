#!/bin/sh
set -eu
python -m py_compile ci-tests/test-browser-release-smoke.py
echo "PYTHON CI SYNTAX: PASS"
