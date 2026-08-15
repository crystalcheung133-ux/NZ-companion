const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const data=fs.readFileSync(path.join(root,'data.js'),'utf8');
const trip=fs.readFileSync(path.join(root,'trip-runtime.js'),'utf8');
const nav=fs.readFileSync(path.join(root,'guide-navigation-runtime.js'),'utf8');
const checks=[
 ['Alpine cashback',data.includes('"cashbackAmount": "−AUD 52.61"')&&data.includes('"netTotalAUD": "AUD 1,429.96"')],
 ['Rental canonical payment',data.includes('"paymentLabel": "DEPOSIT PAID"')&&data.includes('"balanceDue": "AUD 513.05"')],
 ['Activity shared payment',trip.includes('accommodationPaymentHTML(booking),activityFamilyBreakdownHTML')],
 ['Rental shared payment',trip.includes('buildRentalCarHTML')&&trip.includes('accommodationPaymentHTML(booking)')],
 ['Activity previous next',trip.includes('activityDetailNavigationHTML(booking.id)')],
 ['Guide inferred activities',nav.includes('const inferred=Object.keys(guide.places||{})')]
];
let fail=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'}: ${name}`);if(!ok)fail++;}process.exit(fail?1:0);
