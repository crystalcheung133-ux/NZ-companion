const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync('booking-authority.js','utf8');
function store(){const m=new Map();return{readJSON:(k,f)=>m.has(k)?JSON.parse(JSON.stringify(m.get(k))):f,writeJSON:(k,v)=>(m.set(k,JSON.parse(JSON.stringify(v))),true),remove:k=>(m.delete(k),true)}}
function load(st,master){const c={globalThis:null,STORAGE_CONFIG:{keys:{bookingOverrides:'k'}},STORAGE:{local:st},BOOKINGS_DATA:master,document:{dispatchEvent:()=>{}},CustomEvent:function(){}};c.globalThis=c;vm.runInNewContext(code,c);return c.BOOKING_AUTHORITY}
const original={b1:{id:'b1',title:'Hotel',status:'confirmed',paymentStatus:'paid'},b2:{id:'b2',title:'Dinner',status:'planned'}},st=store();
let master=JSON.parse(JSON.stringify(original)),api=load(st,master),r=api.save('b1',{status:'cancelled',paymentStatus:'refunded'});
assert(r.ok);assert.equal(r.booking.title,'Hotel');
master=JSON.parse(JSON.stringify(original));api=load(st,master);assert.equal(api.get('b1').paymentStatus,'refunded');
r=api.save('b1',{status:'confirmed'});assert(r.ok);assert.equal(api.get('b1').paymentStatus,'refunded');
r=api.remove('b2');assert(r.ok);master=JSON.parse(JSON.stringify(original));api=load(st,master);assert.equal(api.get('b2'),null);
console.log('BOOKING PERSISTENCE CONTRACT: PASS');