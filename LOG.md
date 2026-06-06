# Work Log

## 2026-06-06

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
