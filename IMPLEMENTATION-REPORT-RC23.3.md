# RC23.3 — Emergency Recovery Hotfix

## Recovery
- Restored a valid JavaScript `data.js` for GitHub Desktop full-folder deployment.
- Prevents the shell CI runner from being uploaded in place of production data.

## UI
- Raised Trip / Guide / Days popup menus above the fixed bottom navigation.
- Added a safe-area-aware bottom offset and mobile height/scroll constraints.

## CI
- Added Timeline Integrity as an explicit GitHub Actions step.
- Regenerated the production manifest and checksums.
