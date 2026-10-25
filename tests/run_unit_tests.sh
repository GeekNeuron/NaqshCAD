#!/bin/bash
set -e
cd "$(dirname "$0")/unit"
cp ../../js/wallgraph.js ./wallgraph.mjs
node graph_test.mjs
node graph_test2.mjs
if [ -f wallgraph_reference.mjs ]; then node equivalence_test.mjs; else echo "equivalence_test.mjs needs wallgraph_reference.mjs (an earlier copy of js/wallgraph.js); skipped"; fi
