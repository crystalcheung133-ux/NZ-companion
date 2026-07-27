# NZ Companion — Guide Address Integrity Audit

**Baseline:** NZ-Companion-Production-Frozen-Stage3.2H.zip  
**Result:** PASS WITH 1 OPERATOR-SPECIFIC CONFIRMATION REQUIRED

## Scope

Audited every Guide List entry for official name, usable physical address or meeting point, and navigation target. Private accommodation was not searched publicly. Area and route cards were assessed by whether their navigation target is operationally useful rather than whether they have a postal street number.

## Auto-fixed verified addresses

- Riverside Market — full Christchurch address and direct map search.
- Tapataia Mahaka / Peter’s Lookout — replaced generic “Lake Pukaki”.
- Hooker Valley Track — navigation now targets White Horse Hill Car Park, the DOC trailhead.
- Lindis Pass Lookout — replaced generic SH8 / Otago wording.
- Cardrona Hotel — replaced incomplete road-only address.
- Saigon Kingdom — set to the central Steamer Wharf branch at 88 Beach Street.
- Sandfly Cafe — 9 The Lane.
- Miles Better Pies — 17 Town Centre.
- The Fat Duck — 124 Town Centre.
- The Lakefront Cafe — 94 Te Anau Terrace.
- Skippers Canyon 4WD — Info & Track meeting point, 37 Shotover Street.
- Arrowtown Gold Panning — Lakes District Museum, 49 Buckingham Street, where pans are hired.
- Doubtful Sound — RealNZ Manapouri Visitor Centre, 64 Waiau Street.
- Tasman Glacier / Blue Lakes — Tasman Glacier Car Park at the end of Tasman Valley Road.
- Astro Cafe and Mt John — summit / Godley Peaks Road navigation.
- Mackenzies Bar & Grill — Unit 1, Lake Tekapo Shopping Centre.
- Greedy Cow — corrected postcode to 7945.

## Confirmed as valid without changes

Accommodation, major restaurants, booked attractions, airports, parking utilities and named venues with already complete addresses were retained. Peppers Bluewater Resort’s official postal code remains **7945**, as shown by the property’s official site.

## Intentionally non-postal cards

The following are route/area guides rather than businesses and may legitimately use a route origin, area or scenic destination: Christchurch CBD Discovery Walk, Lake Tekapo Village, Glenorchy / Paradise Scenic Drive, Queenstown Central and Te Anau. Their map links remain the operational navigation authority.

## Private address handling

Queenstown Airbnb remains exactly as supplied in the trip data and was not externally searched or altered.

## Needs user confirmation

### Queenstown White Water Rafting
The current card does not identify the operator or whether the intended product is Shotover or Kawarau rafting. Meeting points differ by provider/product. The generic city address has therefore been replaced with a clear “confirm operator-specific meeting point” warning rather than inventing an address.

Please confirm the intended operator or booking link before this card is treated as navigation-ready.

## Freeze rule added

A Guide card now fails address review when a named storefront, hotel, restaurant or booked activity contains only a city/region name. Route and area cards are exempt only when the navigation URL defines a usable route or destination.
