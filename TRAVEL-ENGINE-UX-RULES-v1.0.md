# Travel Engine UX Rules v1.0

## 1. Trip = Action
Trip is the operational layer. It answers: **What do I need to do now?**

Trip cards should fit on one mobile screen whenever practical and contain only:
- status
- booking platform and reference
- reservation/check-in details
- room, guests or booked service
- payment, cashback and net cost
- cancellation or essential operational notes
- address, Navigate and Copy Address
- Open Guide

Trip must not contain hotel/venue storytelling, facilities, nearby suggestions,
official phone numbers or official websites.

## 2. Guide = Knowledge
Guide answers: **Tell me more.**

Guide owns:
- why it was chosen
- what is special
- facilities
- nearby places
- parking and practical destination knowledge
- official phone number and official website
- experience tips

Guide must not repeat booking reference, payment, cashback or cancellation data.

## 3. One Source of Truth
Every field has one owner:
- booking data → Trip
- descriptive/place data → Guide
- schedule order and time → Timeline

Links may connect modules, but content must not be copied between them.

## 4. Studio Behaviour
- PIN opens Trip Studio directly.
- The top-right × closes the workspace only; Studio remains unlocked.
- Leave Studio Mode exits the privileged session and requires the PIN next time.
- The Studio selector is an entry/re-entry control, not a second workspace card.

## 5. Shared Data Permissions
For Expenses and Moments:
- owner party: view, edit and delete
- other parties: view only
- Trip Studio: edit and delete all
- every delete requires explicit confirmation

Legacy Expenses without `createdBy` use `paidBy` as the ownership fallback.

## 6. Overlay Rule
Only one primary overlay may be open at a time:
Trip, Guide, Days or Studio.

## 7. Mobile Priority
Operational information must be reachable without long scrolling.
Guide content may be longer because it is optional reading.

## Guide Card Standard v1.0 (RC25.2)

- Why Go / Why Stop / Why Stay must explain the trip-specific purpose in one concise statement.
- Good to Know is optional and appears only for information that can change the traveller's action (for example pre-booking, arrival deadlines, weather dependence, cash-only payment, limited signal or last entry).
- Restaurants and cafes show Suggested Dishes, Trading Hours and booking advice when applicable.
- Shops, supermarkets and markets show Why Stop, Trading Hours and parking only when useful.
- Experiences show booking/session information, duration, meeting point and arrival requirement; ordinary trading hours are not forced onto booked tours.
- Open-access scenic spots do not show hours. Paid, gated or scheduled attractions may show Opening Hours and Admission.
- Accommodation uses Stay, Useful and Why Stay; reception/check-in boilerplate is not repeated.
- Every Guide detail uses the shared Navigate / Booking / Previous / Next action system according to available relationships.
- Seasonal information outside the September–October trip season is omitted, while same-season day variations remain useful.

