# RC22.1 Unicode Repair Test Report

## Result

PASS

## Automated validation

- Engine Integrity and Planning: 46/46 passed.
- Generation Selection Adapter: 19/19 passed.
- Master File Importer: 23/23 passed.
- Unicode regression: 6/6 passed.
- Total automated tests: 94/94 passed.
- Freeze validation: PASS.
- Production/test JavaScript syntax: 43 files passed.

The final Unicode scan covered 70 shipped text-source files:

- strict UTF-8: PASS;
- UTF-8 BOM count: 0;
- fixed mojibake marker matches: 0;
- heuristic UTF-8-as-Windows-1252 matches: 0;
- replacement characters: 0;
- C1 controls: 0;
- required intended Unicode characters present: PASS.

## Localhost rendered validation

The repaired Full Deploy source was served at `http://127.0.0.1:8766`.

Visually inspected:

- Home;
- Trip and Flights modal;
- Guide category modal;
- Days 1–10;
- Moments;
- Expenses;
- Place detail;
- Home and Day weather cards;
- Home currency card;
- bottom navigation;
- Trip, Guide, and Place modal close buttons.

Rendered results:

- no visible mojibake;
- no missing emoji;
- no replacement characters;
- correct `×` close symbols;
- correct `›` navigation chevrons;
- correct apostrophes, middle dots, degree symbols, arrows, macrons, and emoji;
- Days 1–10 rendered 66 total itinerary items;
- core browser console errors: 0.

## Home DOM text evidence

The following text was captured from `document.body.innerText` after Home finished rendering:

```text
New Zealand Companion
MEL
New Zealand
Companion
Three cities. One reunion.
22 Sep — 1 Oct 2026
South Island
⏳
COUNTDOWN
61 days to go
🕒
NEW ZEALAND
21:51
View clocks ›
⛅
TODAY · CHRISTCHURCH
6–16°C · Partly cloudy
Rain 32% · Details ›
💱
CURRENCY
NZD 100 ≈ AUD 83.19
Rate date · 2026-07-22
Let's go · Day 1
🏔️ SIGHTS & ACTIVITIES
›
🍽 DINING
›
🏨 STAY
›
✈️ Flights
MEL · CHC · ZQN
›
🚙 Rental Car
RENTAL CARS 247 · ASX
›
🏨 Accommodation
BOOKINGS & ADDRESSES
›
✅ Checklist
BEFORE THE TRIP
›
☎️ Emergency
CONTACTS & MEDICAL CARE
›
✈️ Day 1
ARRIVAL IN CHRISTCHURCH
22 SEP • TUESDAY
›
🚙 Day 2
CHRISTCHURCH TO LAKE TEKAPO
23 SEP • WEDNESDAY
›
🏔️ Day 3
LAKE TEKAPO VIA AORAKI / MT COOK TO WĀNAKA
24 SEP • THURSDAY
›
🧩 Day 4
WĀNAKA TO QUEENSTOWN · FAMILIES UNITE
25 SEP • FRIDAY
›
🚡 Day 5
QUEENSTOWN HIGH VIEWS & KIWI BIRDS
26 SEP • SATURDAY
›
😴 Day 6
QUEENSTOWN FLEXIBLE DAY
27 SEP • SUNDAY
›
🏘️ Day 7
ARROWTOWN & DEER PARK HEIGHTS
28 SEP • MONDAY
›
🚙 Day 8
QUEENSTOWN TO TE ANAU
29 SEP • TUESDAY
›
🚌 Day 9
MILFORD SOUND DAY TOUR
30 SEP • WEDNESDAY
›
🚙 Day 10
TE ANAU TO QUEENSTOWN AIRPORT & DEPARTURE
1 OCT • THURSDAY
›
🧳
Trip
📖
Guide
🗓
Days
✨
Moments
💸
Expenses
```

The captured text contains the required intended Unicode characters and no legacy-code-page or replacement characters.
