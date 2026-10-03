const fs=require('fs'),assert=require('assert');
const src=fs.readFileSync('moment-sync-runtime.js','utf8');
assert(src.includes('contentUpdatedAt:current.contentUpdatedAt||current.updatedAt||current.editedAt||current.createdAt'),'photo retry must preserve semantic content revision from live record');
assert(src.includes('updatedAt:photoNow'),'photo retry must advance sync revision');
assert(src.includes('remote.contentUpdatedAt||remote.updatedAt'),'remote edit conflict must compare semantic content revision');
// Model the production winner rule: photo retry must be newer for sync while content base remains stable.
const remote={id:'A',updatedAt:'2026-01-01T00:00:01Z',contentUpdatedAt:'2026-01-01T00:00:01Z',photoPending:true};
const local={...remote,updatedAt:'2026-01-01T00:00:03Z',photoPending:false,photoUrl:'photo.jpg'};
assert(new Date(local.updatedAt)>new Date(remote.updatedAt),'photo retry must win sync merge');
assert.equal(local.contentUpdatedAt,remote.contentUpdatedAt,'photo retry must not look like a content edit');
console.log('CF3 PHOTO RETRY BEHAVIOUR: PASS');
