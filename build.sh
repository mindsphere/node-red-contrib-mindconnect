#/usr/bin/bash

npm install ./`ls mindconnect-mindconnect-nodejs-*.tgz | tail -n 1`
npm install
npm install ./`ls mindconnect-node-red-contrib*.tgz | tail -n 1`
