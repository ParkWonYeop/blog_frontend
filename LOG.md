# Work Log

## 2026-07-13

- Prepared the completed repository-wide structural refactor and contributor documentation for publication on `main`, including all new domain modules, extracted feature components, removed starter assets, and deployment-safe `public/.gitkeep`.
- Integrated the latest remote Maia chess game work while rebasing, preserving the game lobby, history, play, resign, undo, puzzle board, and visual refinements alongside the new domain type and query-key structure.
- Validation: `npm run check`, `npm run build`, and `git diff --check` passed after remote integration. The production build emitted the existing Node `--localstorage-file` path warning but completed successfully, including all 16 static pages and the new Maia chess routes.
- Normalized the Git Author and Committer email metadata across `dev`, `feature/renew`, and `main` to the verified GitHub account email while preserving commit messages, AuthorDate values, file trees, and branch topology. Created and verified a recovery bundle before rewriting history.
- Validation: all three branches retained their original commit counts and tree/date/message fingerprints, every reachable Author and Committer email matches the configured GitHub email, and the rewritten `main` tree matched the pre-rewrite tree before this log-only commit.
- Recommended next task: add focused automated tests for the pure `src/lib` helpers and concurrent authentication refresh coordinator before making further structural changes.

## 2026-07-11

- Rewrote `README.md` as a practical project guide covering real features, local setup, environment configuration, scripts, architecture, authentication, security boundaries, deployment, and contribution rules.
- Rewrote `AGENTS.md` against the refactored repository so future contributors have accurate module boundaries, protected contracts, validation requirements, storage keys, and backend/auth limitation guidance. Added `public/.gitkeep` so the Docker `COPY public` step remains valid after starter assets were removed.
- Validation: cross-checked documented paths, scripts, environment values, storage keys, Docker/Gitea behavior, and package metadata against the repository; `npm run check` and `git diff --check` passed.
- Recommended next task: simplify the verbose legacy comments in `DockerFile` and `.gitea/workflows/deploy.yml` while preserving their deployment behavior.

- Refactored the codebase without changing backend endpoints or user workflows: split the monolithic shared type file into domain modules, introduced typed pagination and post-list parameters, and enabled `noUncheckedIndexedAccess` with a dedicated `typecheck`/`check` workflow.
- Centralized environment values, query keys, API error extraction, Korean date formatting, category traversal, post summary/notice rules, pagination normalization, and safe URL segment/redirect handling under `src/config` and `src/lib`.
- Rebuilt token refresh around a single session coordinator: concurrent requests in one tab share one refresh promise, supported browsers serialize cross-tab refreshes with Web Locks, persisted tokens are synchronized before reissue, and the provider/editor/interceptor now use the same implementation.
- Split the largest mixed-responsibility UI files into focused post-editor, post-delete-dialog, and desktop-Dock modules while preserving the existing storage keys, animation timing, labels, routes, and mutation behavior.
- Standardized React Query cache keys and invalidation across public, comment, profile, admin, and chess features; improved keyboard/button semantics and removed nested `main` landmarks without visual layout changes.
- Replaced the create-next-app README and stale design specification with project-specific architecture, operation, and UI-system documentation. Removed unused Headless UI, Heroicons, runtime Yarn dependencies and unused starter SVG assets. Only `package-lock.json` was updated; `yarn.lock` was intentionally left unchanged because npm is the repository baseline.
- Validation: `npm run check`, `npx tsc --noEmit --noUnusedLocals --noUnusedParameters`, `npm ls --depth=0`, `git diff --check`, and `npm run build` passed. In-app browser verification covered `/`, `/archive`, `/category/공지`, `/login`, `/signup`, `/play/chess`, and the unauthenticated `/admin` guard at desktop and 390px mobile widths with no horizontal overflow, duplicate IDs, unnamed buttons, nested main landmarks, or console warnings/errors. Backend-dependent populated content and authenticated admin forms could not be exercised because the local backend/admin session was unavailable.
- Recommended next task: add focused automated tests for the pure `src/lib` helpers and concurrent auth refresh coordinator, then run an authenticated admin browser pass against a reachable backend for create/edit/upload/delete workflows.

## 2026-06-24

- Refined the chess board visual style to match the app's glass/control surfaces instead of the previous heavy wood-and-token treatment.
- Removed the circular chip backgrounds from pieces, kept high-contrast glyphs with subtle outlines, softened square/highlight colors, and tightened coordinate labels for a cleaner chess UI.
- Rebalanced chess board sizing and layout columns so the board window, actual board, side panel, and Dock spacing feel less awkward on a 1280x720 desktop viewport.
- Validation: `npm run lint` passed and `npm run build` passed. Browser verification on `http://localhost:3124/play/chess` with a temporary local puzzle API confirmed 64 squares, 32 rendered pieces, a 350px visible board above the Dock, balanced 480px/320px board-panel windows, and no console errors. The temporary API was stopped after verification.
- Recommended next task: verify the real authenticated `/chess/play/{gameId}` board against the Maia backend at common laptop heights and tune only the board size formula if the live game info panel changes vertical rhythm.

## 2026-06-19

- Added Maia game resign and undo API wrappers, then wired the play screen with in-progress-only "무르기" and "기권" actions plus a persistent "새 게임" link back to the setup screen.
- Locked board/actions during move, undo, and resign requests, updated the game cache from backend responses as the single source of truth, and refreshed history/stat queries after successful state changes.
- Added resigned-loss labeling so play, recent games, and history can show `기권패` for `RESIGNED` losses while still grouping them under losses.
- Validation: `npm run lint` passed and `npm run build` passed. Authenticated browser verification against the live Maia backend was not run in this session.
- Recommended next task: test resign and undo with an authenticated real game, including black-player games where Maia's opening white move must remain after undo.

- Reworked the shared chess board UI with a bordered board surface, high-contrast chip-style pieces, stronger selected/legal/last-move highlights, and transform-based piece movement transitions so player and Maia moves read as motion instead of instant jumps.
- Connected the daily puzzle board to the shared `ChessBoard` component, removing duplicated piece rendering and adding drag/drop support for puzzle moves.
- Updated Maia play state so optimistic player moves are highlighted locally while pending, then Maia's returned move can animate from the server response; changed the pending overlay into a small status pill so it no longer hides the board.
- Validation: `npm run lint` passed and `npm run build` passed. A local dev server is running on `http://localhost:3124`; browser verification with a temporary local puzzle API confirmed 64 squares, 32 piece-layer nodes, 0.42s piece transition styling, square selection/legal target markers, and no console errors. The temporary API was stopped after verification.
- Recommended next task: verify `/chess/play/{gameId}` against the real Maia backend with an authenticated account to tune the exact Maia response timing and capture/promotion edge cases.

- Added the authenticated Maia chess frontend: `/chess` lobby with rating/color/model and advanced settings, `/chess/play/[gameId]` playable board with backend FEN synchronization and PGN copy, and `/chess/history` account game history with outcome filters.
- Extended the chess API client and shared types for Maia game create/list/stats/detail/PGN/move endpoints while leaving the public `/api/chess-puzzles/**` puzzle request unchanged.
- Updated the Dock/menu/shell route handling so Chess opens the Maia lobby, with the existing public puzzle page still available at `/play/chess`.
- Validation: `npm run lint` passed and `npm run build` passed. A foreground `next dev --port 3122` startup reached Ready, but persistent detached/browser verification could not be completed because sandbox-launched background dev processes exited or hung before serving requests.
- Recommended next task: verify `/chess`, `/chess/play/{gameId}`, and `/chess/history` in an authenticated browser session against a reachable backend, especially real Maia move latency/error responses.

## 2026-06-07

- Fixed admin pages being pushed outside the visible content area by removing viewport-based `md:w-[80vw]` widths from the admin route shell and Markdown editor container.
- Changed admin containers to use the remaining shell content width (`w-full` with `max-w-[1400px]`) so the sidebar margin no longer combines with an extra viewport-width layout.
- Validation: `npm run lint` passed and `npm run build` passed. Authenticated browser verification was not possible in the current session because `/admin` redirects to login without an admin token.
- Recommended next task: verify `/admin` and `/admin/posts/new` in an authenticated browser session at desktop widths around 1280px and 1440px.

- Fixed the admin dashboard traffic chart visibility by giving bar columns a real height context, so percentage-based bar heights render instead of collapsing.
- Added fallback traffic points from recent/popular post data when the dashboard API or `traffic` array is empty, keeping the graph visible while the backend traffic aggregation is unavailable.
- Validation: `npm run lint` passed and `npm run build` passed. Browser navigation to `/admin` was attempted on `http://localhost:3112/`, but the current browser session was unauthenticated and rendered the login screen, so the admin chart itself was validated by code path and build checks rather than a live authenticated screenshot.
- Recommended next task: verify `/admin` with an authenticated admin session against the production API to confirm the real `traffic` payload replaces the fallback graph.

- Simplified the macOS-inspired layout by removing duplicated navigation surfaces: the desktop shortcut icon layer, the home page's inner Finder sidebar, and app navigation links from the system menu bar.
- Reworked the global sidebar into a cleaner library panel focused on profile, search, and categories, with a quieter compact profile row and no duplicated app shortcuts.
- Kept app-level movement in the Dock, category/search movement in the sidebar, and current-context/status information in the menu bar so each shell area has a clearer role.
- Validation: `npm run lint` passed and `npm run build` passed. In-app browser verification on `http://localhost:3112/` confirmed no horizontal overflow, no desktop shortcut duplicates, the simplified home window, the Korean sidebar header, and no browser console warnings/errors. The local backend remained unavailable, so the home page showed empty post states.
- Recommended next task: test the simplified sidebar with real production categories and long category names, then tune category row spacing if the populated tree feels too dense.

## 2026-06-06

- Reworked the macOS-inspired shell into a fuller desktop illusion: full-width system menu bar, floating Finder-style sidebar window, viewport-centered Dock, desktop wallpaper layers, and desktop shortcut icons for major destinations.
- Rebuilt the public home screen as a Finder window with a locations sidebar, disk/status strip, file-like post rows, Spotlight-style search results, and stronger shared window glass treatment.
- Extended the OS treatment across archive, category, reader, login/signup, admin shell, post cards, and list rows, including file icons, Reader window framing, and cleanup of a stale mojibake notice-category check.
- Validation: `npm run lint` passed and `npm run build` passed. In-app browser verification on `http://localhost:3112/`, `/archive`, and `/login` confirmed no horizontal overflow, desktop/mobile menu and Dock visibility rules, shared window surfaces, and no browser console warnings/errors. The default local API data rendered empty post states during the browser pass.
- Recommended next task: run a visual pass against `NEXT_PUBLIC_API_URL=https://blogserver.wypark.me` so populated post lists and one real reader page can be tuned with long Korean titles and real content.

- Fixed the desktop Dock so route changes from Dock menu links no longer leave focus-held open state behind when the Dock is not pinned.
- Kept the saved `dock-pinned-v2` preference unchanged during navigation and only released transient Dock focus/hover state after menu clicks and pathname changes.
- Validation: `npm run lint` passed and `npm run build` passed. In-app browser verification on `http://localhost:3111/` confirmed that after unpinning the Dock, clicking the Dock archive menu navigates to `/archive`, the pin button remains `aria-pressed=false`, and the Dock collapses after the pointer leaves.
- Recommended next task: do one visual pass on the Dock at narrow desktop widths to confirm the collapse animation still feels smooth around the sidebar offset.

## 2026-06-02

- Refined the public layout after desktop/mobile review: the shell now guards horizontal overflow, uses route-aware bottom padding, hides the top menubar on mobile, and opens the mobile sidebar/search panel from the Dock.
- Reworked the Dock so mobile uses it as the primary navigation hub, while desktop keeps a folded Dock that expands on hover/focus and includes a pin toggle.
- Smoothed the desktop Dock hide/show interaction by separating hover-open, closing, and fully-collapsed states; the Dock now keeps the expanded hit area during the closing animation so re-entering mid-collapse reverses smoothly.
- Changed the desktop Dock's default state to pinned/open and added distinct soft pastel tones to Dock buttons, including stronger visual treatment for pin/unpin and auth actions.
- Softened the Dock button palette to quieter pastel tones and made the light-mode Dock bar read as a cleaner white glass surface.
- Fixed the Dock pin toggle so mouse-based unpinning no longer leaves button focus holding the Dock open, and changed the Dock Home button to a white neutral tone.
- Reworked the Dock material away from cute pastel tiles into a more macOS-like neutral frosted glass texture with translucent white glass buttons.
- Corrected the Dock button direction so only Home stays white, while the other actions keep subtle pastel tints with a translucent macOS-style glass material.
- Increased Dock button translucency contrast so the buttons remain glassy while sitting slightly more opaque than the Dock background.
- Rebalanced the home page around latest posts with popular posts as a supporting panel, converted the post detail page into a quieter reader surface, and hardened Markdown/code/table wrapping against mobile overflow.
- Added a client-side archive explorer with year, month, category, and compact/comfort density controls over the existing server-fetched post list.
- Rebuilt the chess page with safer viewport-aware board sizing, quieter puzzle panels, and enough layout clearance for the Dock.
- Validation: `npm run lint` passed and `npm run build` passed. In-app browser verification on a local `next start` server confirmed no horizontal overflow on `/`, `/archive`, and `/play/chess` at mobile width, mobile Dock-centered navigation opens the sidebar panel without overflow, desktop CSS loads, the mobile Dock is hidden on desktop, and the desktop Dock starts folded with a pin control. The live chess board itself could not be verified because the local backend chess API was unavailable, so `/play/chess` rendered the error state.
- Validation: `npm run lint` passed and `npm run build` passed. In-app browser verification on a local `next start` server confirmed the desktop Dock starts as a small bottom tab, uses 560ms transitions for tab/panel geometry, and expands into the larger Dock hit area when opened.
- Validation: `npm run lint` passed and `npm run build` passed. In-app browser verification on a local `next start` server confirmed the Dock opens by default and Home/Archive/Chess/Login/Signup/Pin buttons render distinct pastel colors.
- Validation: `npm run lint` passed and `npm run build` passed. In-app browser verification on `http://localhost:3106/` confirmed the light-mode Dock bar renders as a cleaner white glass surface and the Dock button colors use quieter pastel tones.
- Validation: `npm run lint` passed and `npm run build` passed. In-app browser verification on `http://localhost:3107/` confirmed the Dock Home button renders white and mouse-based unpinning collapses the Dock after the pointer leaves.
- Validation: `npm run lint` passed and `npm run build` passed. In-app browser verification on `http://localhost:3108/` confirmed the Dock uses neutral translucent glass material, with non-home buttons rendering as subtle white glass rather than pastel color tiles.
- Validation: `npm run lint` passed and `npm run build` passed. In-app browser verification on `http://localhost:3109/` confirmed Home stays white while the other Dock buttons keep pastel-tinted translucent glass backgrounds with button-level blur.
- Validation: `npm run lint` passed and `npm run build` passed. In-app browser verification on `http://localhost:3110/` confirmed Dock buttons remain translucent but render slightly more opaque than the Dock background for clearer contrast.
- Recommended next task: run a browser pass against a reachable backend API, especially one real post detail route and the populated chess puzzle board, then tune any remaining content-specific long-title or board-height edge cases.

## 2026-05-29

- Fixed post detail 404s caused by double-encoding dynamic route slugs that already arrive percent-encoded from URLs such as `/posts/soft-delete%2C-hard-delete`.
- Updated the public post fetch helper to decode a route slug once before encoding it for the backend API path, preserving normal Korean/special-character slug requests while avoiding `%252C`-style API lookups.
- Validation: `npm run lint` passed and `npm run build` passed. A local production server with `NEXT_PUBLIC_API_URL=https://blogserver.wypark.me` returned real post titles for `/posts/soft-delete%2C-hard-delete`, `/posts/destructuring-%26-component%ED%95%A8%EC%88%98`, and `/posts/rtr-(refresh-token-rotation)`.
- Recommended next task: deploy the slug normalization fix before re-checking affected live post URLs in Search Console or the browser.
- Added a category post-list page size control with 9/18/27 options, defaulting to 9 and persisting the user's choice in `localStorage` under `categoryPageSize`.
- Wired the selected category page size into the React Query key and `getPostsByCategory` request size, resetting to page 1 when the size changes while preserving search behavior.
- Adjusted the category page toolbar so search, page-size controls, and grid/list controls stack cleanly on narrow screens and align in one row on desktop.
- Validation: `npm run lint` passed and `npm run build` passed. Static verification confirms the category query uses `pageSize` and the page-size selector persists to `localStorage`; interactive browser verification was skipped because no local browser/Playwright automation runtime is available in this environment.
- Recommended next task: verify the category toolbar in a real browser after deploy, especially mobile widths and the 18/27 page-size transitions.
- Investigated Google Search Console crawlability concerns for the live site.
- Checked live `robots.txt`, `sitemap.xml`, homepage, sample post pages, and backend post API with a Googlebot user agent; public post URLs in the sitemap returned 200 with no `X-Robots-Tag` or meta robots block.
- Confirmed the non-www production host `blog.wypark.me` is the relevant host; its home/archive initial HTML currently contains no `/posts/` links because public lists are client-side rendered.
- Identified crawlability risk areas: home/archive rely on client-side post-list fetching, local builds generate a static-only sitemap when the backend API is unreachable, sitemap `lastmod` values can be timezone-skewed when backend timestamps omit an offset, and canonical URLs are not currently emitted.
- Validation: `npm run build` passed. As expected without a local backend, build-time sitemap generation logged `fetch failed` and produced only static sitemap entries in the local `.next` output.
- Converted home and archive pages to server-rendered public post lists through a dedicated `src/api/publicPosts.ts` fetch helper so first HTML now includes discoverable `/posts/` links.
- Added centralized site metadata utilities, canonical metadata for public pages/posts, dynamic sitemap generation, KST-aware API date parsing for `lastmod`, and robots/site URL reuse.
- Validation: `npm run lint` passed and `npm run build` passed. A local production server with `NEXT_PUBLIC_API_URL=https://blogserver.wypark.me` returned 22 `/posts/` links on `/`, 204 on `/archive`, canonical URLs for both pages, and sitemap output with 104 URLs including 102 post URLs.
- Recommended next task: deploy the SEO crawlability fix, then resubmit `https://blog.wypark.me/sitemap.xml` and a representative post URL in Google Search Console URL Inspection.
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
- Unified the macOS-inspired layer system by splitting window, card, control, sidebar, menu bar, and Dock border/shadow/blur tokens, with stronger dark-mode card separation.
- Applied the layer tokens across shared surfaces, the menu bar, Dock, sidebar controls, search/toggles, home dashboard panels, reader navigation cards, and admin dashboard/editor panels.
- Validation: `npm run lint` passed, `npm run build` passed, and in-app browser verification on `http://localhost:3100/` confirmed distinct light/dark computed border, shadow, and backdrop blur values for the menu bar, main window, internal cards, and Dock.
- Recommended next task: do a visual pass on lower-traffic admin list/modal screens and convert any remaining ad hoc hover fills to the shared card/control tokens.
