# Work Log

## 2026-05-29

- Redesigned the app shell into a macOS-inspired blog OS with pastel desktop background tokens, translucent menu bar, quick-launch Dock, and reusable window surfaces.
- Applied the window treatment to the home dashboard, post reader, archive, category view, auth screens, chess puzzle view, and admin management shells.
- Restored the missing local `chess.js` install in `node_modules` so build verification could run; no dependency version changes were intended.
- Refined the desktop layout after review: the sidebar can now collapse on PC, the main window width is more consistent across dashboard/list/reader/chess/admin views, the sidebar archive shortcut was removed, and the top menu now uses WYPark branding with GitHub/email links plus theme switching only.
- Moved auth/admin/write/logout actions into the Dock and changed category windows/menu labels to show the actual category name instead of Finder/posts copy.
- Tuned the follow-up layout: main content now centers inside the area remaining after the desktop sidebar, sidebar GitHub/email shortcuts were removed, top-bar GitHub/email links now sit as plain left-side menu items, and the home labels were simplified to 홈/WYPark.
- Softened the home dashboard inner popular/latest sections so they no longer render as nested macOS windows with traffic-light controls; they now read as embedded dashboard panels inside the WYPark window.
- Rebuilt the admin post writing screen as a glassy Markdown Studio with a larger writing area, publish controls, category/tag/image/draft panels, and fixed MDEditor foreground colors so typed text remains readable in both light and dark themes.
- Hardened the Markdown editor text visibility fix by binding the editor color mode to the app's resolved theme and forcing the real textarea layer to use `--color-text` while hiding the syntax overlay text layer that could inherit the wrong contrast.
- Validation: `npm run lint` passed, `npm run build` passed. The build logged a sitemap fetch warning because the backend API at the local default was not reachable, but the command completed successfully.
- Browser verification: previously started this app on `http://localhost:3100` because ports 3000 and 3001 were already occupied; confirmed desktop background gradients, menu bar, Dock, and window surfaces on `/`, `/archive`, and `/login`. For this follow-up, the dev/standalone server started successfully in foreground but exited when launched as a background non-interactive process, so browser verification was skipped after lint/build passed.
- Recommended next task: review the remaining older Korean strings in admin/editor flows and normalize any mojibake that predates this redesign.
