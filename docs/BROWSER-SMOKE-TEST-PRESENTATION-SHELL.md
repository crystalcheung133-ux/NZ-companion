# Travel Engine Browser Smoke Test — Presentation Shell

Use this after any change touching Studio, modal geometry, fixed headers, bottom navigation, mobile viewport, or scroll ownership.

## Required viewports
- Mobile portrait: approximately 390×844.
- Narrow mobile: approximately 360×740.
- Desktop: approximately 1440×900.

## Five mandatory flows

### 1. Studio persistent chrome
1. Enter Studio with the PIN.
2. Confirm the highlighted Studio status bar is visible.
3. Confirm the traveller header/user selector is fully visible immediately below it.
4. Close the Studio popup.
5. Confirm the status bar remains while Studio authentication remains active.

### 2. Studio popup workspace
1. Enter Studio with the PIN.
2. Confirm Studio opens as a popup card over the Companion, not a full-page route.
3. Close the popup and confirm the underlying Companion remains at the previous page/scroll context.

### 3. Studio re-entry
1. While Studio is still authenticated, open the traveller selector.
2. Confirm it opens positioned directly at the Studio card.
3. Scroll upward and confirm traveller choices are still reachable.
4. Switch to a different traveller and confirm Studio mode exits.

### 4. Expense popup
1. Open Add Expense.
2. Confirm the form starts at the top.
3. Scroll to the bottom and confirm Save is fully visible and usable.
4. Confirm the bottom navigation cannot be used while the popup is open.
5. Close and reopen; confirm the form starts at the top again.

### 5. Moments popup
Repeat the Expense checks for Moments, including mobile scrolling to the final Save action.

## Failure rule
Any clipping, overlap, hidden primary action, inaccessible traveller selector, full-page Studio regression, or usable bottom navigation behind an open popup is a release blocker.
