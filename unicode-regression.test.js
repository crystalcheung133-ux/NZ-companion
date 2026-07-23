/* RC22.1 dependency-free source-encoding regression gate. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=__dirname;
const textExtensions=new Set(['.html','.js','.json','.css','.md','.txt','.webmanifest']);
const files=fs.readdirSync(root).filter(name=>textExtensions.has(path.extname(name))).sort();
const decoder=new TextDecoder('utf-8',{fatal:true});
const tests=[];
const test=(name,fn)=>tests.push({name,fn});
const cp=(...values)=>String.fromCodePoint(...values);
const fixedMarkers=[
  cp(0x00f0,0x0178),      // UTF-8 emoji lead bytes decoded through a legacy code page
  cp(0x00e2,0x20ac),
  cp(0x00e2,0x0153),
  cp(0x00e2,0x02dc),
  cp(0x00e2,0x00ad),
  cp(0x00c2,0x00b7),
  cp(0x00c2,0x00b0),
  cp(0x00c3,0x2014),
  cp(0x00ef,0x00b8)
];
const expected=[
  cp(0x1f9f3),cp(0x1f4d6),cp(0x1f5d3),cp(0x1f4b8),cp(0x2728),
  cp(0x2708,0xfe0f),cp(0x203a),cp(0x00b7),cp(0x00b0),cp(0x00d7),cp(0x2019)
];
function read(name){
  const bytes=fs.readFileSync(path.join(root,name));
  return {bytes,text:decoder.decode(bytes)};
}

test('all shipped text files are strict UTF-8 without BOM',()=>{
  const failures=[];
  for(const name of files){
    try{
      const {bytes}=read(name);
      if(bytes[0]===0xef&&bytes[1]===0xbb&&bytes[2]===0xbf)failures.push(`${name}: UTF-8 BOM`);
    }catch(error){failures.push(`${name}: invalid UTF-8 (${error.message})`);}
  }
  assert.deepEqual(failures,[]);
});
test('required mojibake marker families are absent',()=>{
  const failures=[];
  for(const name of files){
    const {text}=read(name);
    for(const marker of fixedMarkers)if(text.includes(marker))failures.push(`${name}: ${[...marker].map(character=>`U+${character.codePointAt(0).toString(16).toUpperCase()}`).join(' ')}`);
  }
  assert.deepEqual(failures,[]);
});
test('UTF-8-as-Windows-1252 sequence heuristics are clean',()=>{
  const failures=[];
  const suspicious=[
    new RegExp(cp(0x00f0)+'['+cp(0x0080)+'-'+cp(0x00ff)+cp(0x0152,0x0153,0x0160,0x0161,0x0178,0x017d,0x017e)+']'),
    new RegExp(cp(0x00e2)+'['+cp(0x0080)+'-'+cp(0x00ff,0x0152,0x0153,0x0160,0x0161,0x0178,0x017d,0x017e,0x0192,0x02c6,0x02dc,0x2013,0x2014,0x2018,0x2019,0x201a,0x201c,0x201d,0x201e,0x2020,0x2021,0x2022,0x2026,0x2030,0x2039,0x203a,0x20ac,0x2122)+']'),
    new RegExp('['+cp(0x00c2,0x00c3)+']['+cp(0x0080)+'-'+cp(0x00bf)+']'),
    new RegExp(cp(0x00ef,0x00b8)+'['+cp(0x0080)+'-'+cp(0x00bf)+']')
  ];
  for(const name of files){
    const {text}=read(name);
    if(suspicious.some(pattern=>pattern.test(text)))failures.push(name);
  }
  assert.deepEqual(failures,[]);
});
test('replacement characters and C1 controls are absent',()=>{
  const failures=[];
  for(const name of files){
    const {text}=read(name);
    if(text.includes(cp(0xfffd))||/[\u0080-\u009f]/.test(text))failures.push(name);
  }
  assert.deepEqual(failures,[]);
});
test('required intended Unicode characters remain in production sources',()=>{
  const production=files.filter(name=>!name.endsWith('.test.js')&&!name.endsWith('.md')).map(name=>read(name).text).join('\n');
  const missing=expected.filter(character=>!production.includes(character)).map(character=>[...character].map(value=>`U+${value.codePointAt(0).toString(16).toUpperCase()}`).join(' '));
  assert.deepEqual(missing,[]);
});
test('source scan includes every shipped file with a supported text extension',()=>{
  const expectedFiles=fs.readdirSync(root).filter(name=>textExtensions.has(path.extname(name))).sort();
  assert.deepEqual(files,expectedFiles);
  for(const extension of ['.html','.js','.css','.md','.txt','.webmanifest']){
    assert(files.some(name=>path.extname(name)===extension),`Existing ${extension} source family was not scanned`);
  }
});

let passed=0;
for(const entry of tests){
  try{entry.fn();passed++;console.log(`PASS UNICODE — ${entry.name}`);}
  catch(error){console.error(`FAIL UNICODE — ${entry.name}\n${error.stack||error}`);process.exitCode=1;}
}
console.log(`${passed}/${tests.length} Unicode regression tests passed across ${files.length} text-source files.`);
