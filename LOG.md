# LOG.md

## 2026-05-28

- Created `AGENTS.md` with repository-specific coding-agent guidance for the Next.js blog frontend.
- Updated `AGENTS.md` to require recording completed work in `LOG.md` for each task.
- Validation: confirmed `AGENTS.md` content and checked repository status with a one-off safe-directory git option.
- Started the renewal plan by adding an `/admin` dashboard entry point with admin-only route guarding, post/category summary widgets, and quick access to writing.
- Updated `TopHeader` to show `관리자 설정` and `새 글` only after auth hydration confirms an admin role.
- Renamed the post detail loading file from `loding.tsx` to `loading.tsx`, gated React Query Devtools to development mode, and added `PostSaveRequest` for post create/update APIs.
- Validation: ran `npm ci` successfully after rerunning outside the sandbox due npm cache permissions; targeted ESLint passed for the new admin/header/API/type files; `npm run build` passed; verified `/admin` redirects unauthenticated users to `/login` in the in-app browser on local port 3100. `npm run lint` still fails on existing baseline issues across the repo, mostly `any` usage, React Compiler `set-state-in-effect` findings, and a `require()` in `tailwind.config.ts`.
- Updated `AGENTS.md` so future task wrap-ups must include the recommended next task in `LOG.md`.
- Next task: proceed with renewal Phase 2 by removing profile/category admin editing controls from `Sidebar` and moving those flows into `/admin` tabs or dedicated admin components.
- Continued renewal Phase 2 by reducing `Sidebar` to public navigation only: profile display, search, archive, category links, and social links remain; profile edit modal and category create/delete/move controls were removed.
- Added `/admin` profile and category management panels with profile image upload, profile save, category creation, rename, parent move, and guarded delete confirmation flows using the existing API wrappers.
- Validation: targeted ESLint passed for the changed admin/sidebar files; `npm run build` passed, with the existing sitemap backend connection warning logged as `ECONNREFUSED`; `npm run lint` still fails on the known baseline issues outside this task; local dev server on port 3100 returned HTTP 200 for `/admin`.
- Next task: proceed with renewal Phase 3 by adding an admin posts management view with searchable post rows, edit links, and a non-browser-confirm delete flow.
