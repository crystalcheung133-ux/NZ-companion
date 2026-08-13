const fs=require('fs'),assert=require('assert');
const version=fs.readFileSync('VERSION.txt','utf8').trim();
const release=JSON.parse(fs.readFileSync('RELEASE.json','utf8'));
assert(version===release.artifact_version,'VERSION.txt must exactly match RELEASE.json artifact_version');
assert(release.engine_version === '25.5.2','unexpected engine_version');
assert(release.baseline_engine==='25.5.1','baseline_engine must be 25.5.1');
assert(release.ci_entrypoint==='sh ci-tests/run-all.sh','canonical CI entrypoint drift');
assert(typeof release.runtime_behavior_change==='boolean','runtime_behavior_change must be boolean');
console.log('RELEASE METADATA CONTRACT: PASS');
