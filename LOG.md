# Work Log

## 2026-05-29

- Redesigned the app shell into a macOS-inspired blog OS with pastel desktop background tokens, translucent menu bar, quick-launch Dock, and reusable window surfaces.
- Applied the window treatment to the home dashboard, post reader, archive, category view, auth screens, chess puzzle view, and admin management shells.
- Restored the missing local `chess.js` install in `node_modules` so build verification could run; no dependency version changes were intended.
- Refined the desktop layout after review: the sidebar can now collapse on PC, the main window width is more consistent across dashboard/list/reader/chess/admin views, the sidebar archive shortcut was removed, and the top menu now uses WYPark branding with GitHub/email links plus theme switching only.
- Moved auth/admin/write/logout actions into the Dock and changed category windows/menu labels to show the actual category name instead of Finder/posts copy.
- Validation: `npm run lint` passed, `npm run build` passed. The build logged a sitemap fetch warning because the backend API at the local default was not reachable, but the command completed successfully.
- Browser verification: previously started this app on `http://localhost:3100` because ports 3000 and 3001 were already occupied; confirmed desktop background gradients, menu bar, Dock, and window surfaces on `/`, `/archive`, and `/login`. For this follow-up, the dev/standalone server started successfully in foreground but exited when launched as a background non-interactive process, so browser verification was skipped after lint/build passed.
- Recommended next task: review the remaining older Korean strings in admin/editor flows and normalize any mojibake that predates this redesign.
