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


## 8. One Place, One Description
Each place has one knowledge description, owned by Guide.

- Timeline names the stop, time and next leg.
- Trip contains only operational booking/action data.
- Guide contains the descriptive explanation.
- The same summary must not be repeated in a Guide header and again below.

## 9. Do Not State the Obvious
Do not spend screen space on generic instructions such as “Check in at reception”.

Show an instruction only when it can affect the trip, such as late-arrival procedures,
reception closing times, lockbox access, shuttle arrangements or parking restrictions.
