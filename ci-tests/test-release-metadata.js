const fs=require('fs'),assert=require('assert');
const version=fs.readFileSync('VERSION.txt','utf8').trim(),r=JSON.parse(fs.readFileSync('RELEASE.json','utf8'));
assert.equal(version,r.artifact_version);assert.equal(r.engine_version,'25.6.2');assert.equal(r.ci_entrypoint,'sh ci-tests/run-all.sh');
console.log('RELEASE METADATA CONTRACT: PASS');