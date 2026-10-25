#!/bin/bash
# usage: tests/run_browser_test.sh tests/browser/testS.py
cd "$(dirname "$0")/.."
mkdir -p /tmp/t
(python3 -m http.server 8765 >/dev/null 2>&1 &)
SERVER=$!
sleep 1.5
python3 "$@"
STATUS=$?
pkill -f "http.server 8765" 2>/dev/null
exit $STATUS
