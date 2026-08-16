# Travel Engine 25.4.30 — Studio Popup Re-entry

Clarified Studio contract:
- PIN success opens the existing Studio popup card, not a full-page workspace.
- Closing the Studio popup card keeps Studio mode authenticated.
- Reopening the traveller selector while Studio mode is active opens the traveller selector sheet positioned directly at the Studio card.
- The Studio card is immediately usable without another tap.
- The user may scroll upward to traveller choices; selecting another traveller exits Studio mode through the existing identity-switch contract.
- Expense/modal cleanup from Engine 25.4.28 is unchanged.
