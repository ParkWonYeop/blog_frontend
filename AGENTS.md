# AGENTS.md

Repository-specific instructions for contributors and coding agents working on `blog-frontend`.

## Mission

Maintain WYPark Blog as a production-quality frontend without silently changing its public behavior. Prefer explicit domain boundaries, strict types, accessible markup, and existing project conventions over clever abstractions.

When a task is a refactor, preserve routes, API endpoints, storage keys, query behavior, Korean copy, and user-visible workflows unless the request explicitly authorizes a change.

## Runtime And Source Of Truth

- Production runtime: Node.js 20 (`node:20-alpine` in `DockerFile`).
- Package manager: npm.
- Framework: Next.js 16 App Router with React 19.
- Production site: `https://blog.wypark.me`.
- Production API: `https://blogserver.wypark.me`.
- Local API default: `http://localhost:8080`.
- API environment variable: `NEXT_PUBLIC_API_URL`.

Treat the following as coordinated deployment files:

- `next.config.ts`
- `DockerFile` — preserve this filename casing unless the workflow is changed too.
- `.gitea/workflows/deploy.yml`

The Gitea workflow builds on pushes to `main`, runs the `blog-frontend` container, and maps host port `3005` to container port `3000`.

## Required Workflow

1. Read the relevant route, component, API wrapper, type, and shared helper before editing.
2. Check `git status --short` and preserve unrelated user changes.
3. Keep the patch scoped to the requested behavior.
4. Run validation appropriate to the risk.
5. Record the completed work in `LOG.md`, including validation performed or skipped and one recommended next task.

Do not edit generated output such as `.next`, `node_modules`, build artifacts, or generated type files.

## Package Management

- Use `npm ci` for a clean install.
- Use npm for dependency changes because Docker and CI consume `package-lock.json`.
- Do not update both `package-lock.json` and `yarn.lock` for routine work. Update the npm lockfile only and mention the decision in `LOG.md`.
- Do not add a dependency when a small existing utility or platform API is sufficient.
- Remove a dependency only after verifying it has no source, configuration, or build-time usage.

Available scripts:

```bash
npm run dev
npm run lint
npm run typecheck
npm run check
npm run build
npm run start
```

## Architecture Map

### Routes And Rendering

- `src/app/`: App Router pages, layouts, providers, metadata, sitemap, and robots.
- `src/app/admin/`: administrator routes protected by `AdminRouteShell`.
- `src/components/layout/DesktopShell.tsx`: persistent shell and the application’s only `main` landmark.
- `src/components/layout/`: Sidebar, desktop menu bar, Dock, and shell behavior.

Use Server Components by default. Add `'use client'` only for hooks, events, browser APIs, React Query, Zustand, or client-only libraries.

Rules:

- Keep `useSearchParams` beneath a `Suspense` boundary.
- Follow the repository’s Next.js 16 dynamic route pattern where `params` may be a `Promise`.
- Do not add a nested `main` element inside `DesktopShell`.
- Keep metadata, canonical URLs, sitemap, and robots aligned with `https://blog.wypark.me`.
- Preserve server rendering for public post discovery and SEO-sensitive pages.

### API Boundary

- `src/api/http.ts`: shared authenticated Axios client and retry interceptor.
- `src/api/authSession.ts`: in-tab refresh deduplication, Web Locks coordination, and persisted-token synchronization.
- `src/api/authRefresh.ts`: direct refresh request that intentionally bypasses the shared interceptor.
- `src/api/publicPosts.ts`: server-side public post fetches with Next.js revalidation.
- Other `src/api/*.ts` files: domain-specific backend calls.

UI code must call `src/api` functions instead of backend endpoints directly. Add a typed API function before consuming a new endpoint in a component.

Use the shared `http` client for authenticated JSON requests. Direct Axios calls are restricted to refresh paths or another documented recursion boundary.

Most JSON responses use `ApiResponse<T>` and expose useful data through `response.data.data`. List endpoints may return page metadata at the top level or under `page`; normalize them with `getPageMeta` rather than duplicating fallback logic.

### Server State

React Query keys are created in `src/lib/queryKeys.ts`. Do not add ad hoc array literals for an existing domain.

After a mutation:

- invalidate the domain collection key;
- remove or reset affected detail keys when identity or slug may change;
- do not rely on stale cache state to update later.

Keep query keys serializable and deterministic.

### Authentication

- Zustand auth state is defined in `src/store/authStore.ts`.
- Persisted storage key: `auth-storage`.
- Admin checks require hydration and an `ADMIN` role.
- Browser-only state must not be read during server rendering.
- Never log or render access tokens, refresh tokens, authorization headers, or decoded private claims.

The refresh coordinator is a fragile concurrency boundary. Do not replace the shared promise or Web Locks flow without validating:

- multiple simultaneous 401/403 responses in one tab;
- two browser tabs refreshing at the same time;
- a refresh completed by another tab before lock acquisition;
- missing, expired, malformed, and rotated refresh tokens;
- retry recursion prevention.

Preserve these storage keys unless a migration is part of the task:

- `auth-storage`
- `wyp-theme-mode`
- `sidebar-collapsed`
- `dock-pinned-v2`
- `postViewMode`
- `categoryPageSize`
- `temp_drafts`

Verify storage constants at their definitions before changing persistence behavior.

### Types And Utilities

- `src/types/`: domain types split by API, auth, category, chess, comment, dashboard, post, and profile.
- `src/types/index.ts`: type-only barrel for existing `@/types` imports.
- `src/lib/`: pure helpers for dates, errors, pagination, categories, posts, paths, auth tokens, and query keys.
- `src/config/environment.ts`: public environment defaults.

TypeScript uses `strict` and `noUncheckedIndexedAccess`. Do not weaken compiler options to make a change pass.

Guidelines:

- Prefer `import type` for type-only imports.
- Do not introduce `any`; refine a domain type or use `unknown` with narrowing.
- Model actual optional API fields instead of asserting they always exist.
- Reuse existing helpers before creating another date formatter, error parser, pagination reader, URL decoder, or category traversal.
- Keep `@/*` imports for code under `src`.

### Components And Styling

- `src/components/ui/`: reusable primitives such as `WindowSurface`, `Surface`, `EmptyState`, `StatusBadge`, and `SegmentedControl`.
- `src/components/post/`: post cards, lists, search, reader, Markdown renderer, archive explorer, and TOC.
- `src/components/comment/`: comment form, recursive list, and item UI.
- `src/components/chess/`: shared board, public daily puzzle, authenticated Maia game, and game-history UI.
- `src/components/admin/`: admin panels, dashboard widgets, editor modules, and destructive-action dialogs.
- `src/components/theme/`: light/dark/system theme implementation.

Use Tailwind classes for component styling. Use `globals.css` only for application-wide tokens, shell behavior, typography, or third-party overrides.

Prefer CSS custom properties such as `--color-*`, `--window-*`, `--card-*`, `--control-*`, and `--shadow-*` over new hard-coded colors. Follow `DESIGN.md` when extending the visual system.

Use `lucide-react` for icons. Do not add custom inline SVGs or another icon dependency without a concrete need.

Keep components focused:

- extract cohesive UI sections when a component mixes unrelated forms, dialogs, storage, and rendering;
- colocate feature-specific child components in a feature folder;
- put reusable domain logic in `src/lib`, not inside JSX files;
- avoid creating generic abstractions used only once.

### Accessibility And Responsive Behavior

- Every icon-only button needs an accessible name.
- Use `type="button"` for buttons that must not submit a form.
- Use `aria-pressed` for toggles and `aria-current` for current navigation.
- Keyboard focus must reveal controls that hover reveals.
- Avoid duplicate IDs; use `useId` for reusable form controls.
- Keep a single `main` landmark.
- Check Korean labels and long titles at mobile and desktop widths.
- Prevent horizontal overflow with the existing `min-w-0`, wrapping, and responsive layout patterns.

Admin destructive operations must remain confirmed and visually distinct. Preserve loading, disabled, error, and success states.

### Markdown And User Content

Render post bodies through `src/components/post/MarkdownRenderer.tsx`.

Do not remove `rehype-sanitize` without an explicit security review. When adding Markdown features, validate:

- XSS and unsafe URL handling;
- external link behavior;
- image sizing and overflow;
- syntax highlighting and code copy;
- table and long-line wrapping;
- TOC slug consistency;
- SSR/client compatibility.

The editor inserts uploaded images as Markdown image syntax. Preserve that contract unless the backend upload semantics also change.

Korean is the primary UI language. Save edited files as UTF-8 and inspect diffs for mojibake. Do not mass-rewrite unrelated Korean copy or comments.

## Validation Matrix

Minimum checks by change type:

| Change | Required validation |
| --- | --- |
| Documentation only | `git diff --check` and content/path verification |
| Types, helpers, ordinary components | `npm run check` |
| Routes, layouts, metadata, server fetching | `npm run check` and `npm run build` |
| Auth, HTTP, Markdown, deployment | `npm run check`, `npm run build`, and focused explanation in `LOG.md` |
| Visible UI | Above checks plus browser verification when feasible |

For browser checks, cover the affected route at desktop and a narrow mobile viewport. Inspect console errors, horizontal overflow, accessible names, duplicate IDs, and route transitions.

Backend-dependent features include posts, categories, profile, comments, auth, uploads, dashboard data, chess puzzles, and authenticated Maia games. If the backend or an authenticated session is unavailable:

- do not invent product mocks;
- validate static/error/empty states and isolated logic;
- state precisely what could not be exercised.

## Protected Contracts

Do not silently change:

- public URLs or route shapes;
- API endpoint paths or request payloads;
- production domains;
- Google Analytics or verification IDs;
- auth and UI storage keys;
- query cache identity;
- Markdown sanitization;
- Next.js standalone output;
- Docker container name or port mapping;
- destructive-action confirmation behavior.

If a requested change requires one of these, call it out explicitly and validate the migration path.

## Completion Checklist

Before handing off:

- confirm the diff contains no unrelated edits;
- confirm new files are included in validation;
- run the required commands from the matrix;
- record passed, failed, and skipped validation honestly;
- update `LOG.md` with the current date, summary, validation, and recommended next task;
- mention backend or authentication limitations in the final response.
