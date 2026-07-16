# CCMV Travel Engine Change Protocol — Stage 4F-T Frozen Master

Use this protocol for every future change, regardless of who performs it.

## 1. Establish the baseline

- Use the latest version that has passed deploy regression.
- State the visible Build marker and service-worker cache name.
- Do not mix files from an older ZIP into a newer baseline.

## 2. Identify the Active Source

Before editing, trace the complete path:

- Day content: `data.js` → `ITINERARY_DATA` → inline renderer in `day.html` → `day.html?day=N`
- Place content: `data.js` → `PLACES` → inline renderer in `place.html` → `place.html?id=...`
- Shared behavior: canonical function/module in `script.js`
- Visual styling: canonical rule in `styles.css`
- Cache delivery: `sw.js`

If a visible change does not appear, investigate Active Source, deploy state and cache before adding another patch.

## 3. Patch discipline

- Data-only update: usually `data.js`, `script.js` Build marker and `sw.js`.
- UI-only update: usually `styles.css`, `script.js` Build marker and `sw.js`.
- Behavior change: usually `script.js` and `sw.js`; include the relevant HTML only when its renderer/markup must change.
- Deliver a changed-files ZIP for routine patches.
- Deliver a full production ZIP only for a major verified master checkpoint.
- Do not place stage reports inside the production ZIP.

## 4. No-override rule

Do not solve a problem by automatically adding another later CSS rule or runtime function reassignment.

First determine:

- which declaration/function currently wins,
- whether an earlier rule/function is dead,
- whether the canonical source can be edited directly,
- whether service-worker cache or an old deploy is hiding the change.

Runtime wrappers and duplicate canonical modules require a dedicated audit and regression pilot before consolidation.

## 5. Build and cache evidence

Every deploy patch must:

1. update the visible `Build · ...` marker in `script.js`,
2. use a new `CACHE_NAME` in `sw.js`,
3. verify the expected files exist in the service-worker precache list,
4. confirm the deployed site shows the new Build marker.

Do not mark a deploy PASS without visible version evidence.

## 6. Regression scope

Choose checks based on the changed area, but a meaningful engine patch should cover:

- Home and splash
- Bottom navigation and mini menus
- Trip cards
- Day 1 and Day 5 plus the changed Day/activity
- Guide categories, Shopping Directory and Guide → Day anchors
- one restaurant, one spa and one shop Place page
- Choose Friend
- Moments add/edit/delete/history
- Expenses shared/personal add/edit/delete, totals, settlement and history
- PWA close/reopen and offline fallback where relevant

## 7. Stop conditions

Stop patching and diagnose when:

- UI does not reflect the changed Build,
- `/sw.js` shows the wrong cache name,
- the Vercel production deploy does not match the intended commit,
- an HTML `src`, CSS `content:url`, later selector or runtime reassignment creates Active Source ambiguity,
- a malformed comment or syntax issue can make edited code non-operative.

## 8. Engine boundaries

- Do not redraw CCMV logo assets.
- Do not restore deleted Day or Place HTML copies.
- Do not change stored Moments/Expenses schemas without an explicit migration plan.
- Preserve existing localStorage compatibility reads unless a dedicated migration removes them safely.
- Companion remains the warmer, more active member of the CCMV brand family.

## 9. Acceptance sequence

For cleanup or architecture work:

**Audit → Patch → Static Verification → Deploy → Regression Test → PASS → Next step**

This package passed the Stage 4F-T static freeze verification. Future engine changes must create a new Build marker and cache name; do not silently edit the frozen baseline. A working deploy is not automatically a clean replacement baseline until regression testing passes.
