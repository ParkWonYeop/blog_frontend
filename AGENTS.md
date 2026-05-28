# AGENTS.md

Repository-specific instructions for coding agents working on `blog-frontend`.

## Project Overview

- This is the frontend for WYPark Blog, built with Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, TanStack React Query, Zustand, and Axios.
- The app talks to a backend API through `NEXT_PUBLIC_API_URL`.
  - Local default: `http://localhost:8080`
  - Production API used by deploy: `https://blogserver.wypark.me`
  - Public site metadata uses: `https://blog.wypark.me`
- Node 20 is the production baseline. The Docker build uses `node:20-alpine`.

## Repository Layout

- `src/app/`: Next.js App Router routes, root layout, providers, metadata, sitemap, and robots.
- `src/components/layout/`: persistent layout components such as `Sidebar` and `TopHeader`.
- `src/components/post/`: post listing, detail, Markdown rendering, search, and TOC components.
- `src/components/comment/`: comment form, list, and item components.
- `src/api/`: API client wrappers. Use these instead of calling backend endpoints directly from components.
- `src/api/http.ts`: shared Axios instance, auth header injection, and token refresh handling.
- `src/store/authStore.ts`: persisted auth state with Zustand.
- `src/types/index.ts`: shared API and domain types.
- `public/`: static assets.
- `.gitea/workflows/deploy.yml`: Gitea deployment pipeline.
- `DockerFile`: production Docker image definition. Keep the current filename casing unless changing the deploy workflow too.

## Package Manager And Commands

- Prefer `npm` for scripts and dependency work because `package-lock.json`, Docker, and CI use npm.
- Do not update both `package-lock.json` and `yarn.lock` for routine changes. If dependencies must change, update the npm lockfile and leave a note about the lockfile decision.
- Common commands:
  - `npm ci` to install dependencies from the lockfile.
  - `npm run dev` to start local development on port 3000.
  - `npm run lint` for ESLint.
  - `npm run build` for production build validation.
  - `npm run start` after a successful build.

## Environment

- Use `NEXT_PUBLIC_API_URL` when testing against a non-local backend.
- Features that fetch categories, posts, profile, comments, auth, or uploads require the backend API to be reachable.
- If the backend is not running, prefer validating static rendering, linting, and isolated UI logic instead of inventing mock API behavior.

## Coding Conventions

- Keep TypeScript strict. Add or refine shared types in `src/types/index.ts` instead of spreading untyped `any` through components.
- Use the `@/*` alias for imports from `src`.
- Prefer existing local patterns over new abstractions.
- Keep components focused and colocate small UI-only helpers near the component that uses them.
- Preserve the existing Tailwind-first styling approach. Use global CSS only for app-wide behavior or third-party component overrides.
- Prefer icons from the existing icon libraries (`lucide-react`, `@heroicons/react`) instead of custom inline SVGs.
- User-facing copy is Korean-first. When editing Korean text, save files as UTF-8 and verify the rendered text or diff so strings do not become mojibake.
- Some existing files contain Korean comments and UI strings. Do not mass-rewrite text while making unrelated changes; fix only the text needed for the task.

## Next.js App Router Rules

- Use Server Components by default.
- Add `'use client'` only when a component uses hooks, browser APIs, localStorage, React Query hooks, Zustand hooks, events, or client-only libraries.
- Components that use `useSearchParams` should remain under a `Suspense` boundary.
- Dynamic route params follow the current Next.js 16 style in this repo, where route components may receive `params` as a `Promise`.
- Keep metadata, sitemap, and robots changes aligned with the production domain `blog.wypark.me`.

## Data Fetching And API Rules

- Use `src/api/*` functions from UI code. Add new backend calls there before consuming them in components.
- Use `http` from `src/api/http.ts` for authenticated JSON API calls so auth headers, credentials, and refresh behavior stay consistent.
- Direct `axios` calls should be limited to token refresh paths or cases where the shared interceptor would recurse.
- API responses generally follow `ApiResponse<T>` with useful data under `response.data.data`.
- Keep React Query keys stable and descriptive, following existing patterns such as `['posts', ...]`, `['post', slug]`, `['categories']`, `['profile']`, and `['comments', postSlug]`.
- After mutations, invalidate or reset the related queries rather than relying on stale cache state.

## Auth And Permissions

- Auth state lives in `useAuthStore` and is persisted under `auth-storage`.
- Admin-only UI checks generally use `_hasHydrated` plus `role?.includes('ADMIN')`.
- Avoid reading localStorage during server rendering. Gate browser-only auth logic behind client components and effects.
- Be careful around token refresh. There is queueing and Web Locks logic in `src/api/http.ts`; do not simplify it without testing concurrent 401 behavior.
- Do not expose refresh tokens or auth tokens in logs, UI, or error messages.

## Markdown And Content Rendering

- Render post content through `src/components/post/MarkdownRenderer.tsx`.
- Keep `rehype-sanitize` in the Markdown pipeline unless there is a deliberate, reviewed security change.
- When adding Markdown features, consider XSS, external links, image behavior, syntax highlighting, TOC generation, and SSR/client compatibility.
- Uploaded images are inserted as Markdown image syntax by the write page. Preserve that convention unless changing backend upload semantics too.

## UI And UX Guidelines

- Preserve the main layout: fixed sidebar on larger screens, mobile sidebar toggle, top-right auth/write controls, content area with responsive widths.
- Keep blog reading surfaces calm and content-focused. Avoid large decorative sections unless the user explicitly asks for a redesign.
- Ensure text fits on mobile and desktop, especially Korean labels in buttons, cards, modals, and sidebar items.
- For admin flows, keep destructive actions confirmed and visually distinct.
- For forms, preserve loading, disabled, error, and success states with `react-hot-toast` or the existing local patterns.

## Validation Expectations

- For most code changes, run `npm run lint`.
- Run `npm run build` when changing routing, layout, metadata, data fetching, auth, Markdown rendering, or build/deploy config.
- For visible UI changes, start `npm run dev` and verify the affected route in a browser when feasible.
- If validation cannot run because dependencies or the backend are unavailable, state that clearly and explain what was checked instead.

## Deployment Notes

- The production Docker image uses standalone Next output. Keep `next.config.ts` `output: 'standalone'` unless the deployment strategy changes.
- The Gitea workflow builds on pushes to `main`, passes `NEXT_PUBLIC_API_URL=https://blogserver.wypark.me`, runs the container as `blog-frontend`, and maps host port `3005` to container port `3000`.
- Keep Docker, Gitea workflow, and Next config changes synchronized.

## Change Discipline

- Keep edits scoped to the requested task.
- Record completed work in `LOG.md` as part of each task. Include the date, a brief summary of changes, and any validation performed or skipped.
- When finishing a task and updating `LOG.md`, also leave a concise note about the recommended next task so future agents can continue smoothly.
- Do not rewrite generated files, `.next`, `node_modules`, build output, or unrelated lockfiles.
- Do not silently change public URLs, analytics IDs, SEO behavior, auth storage keys, or backend endpoint paths.
- When touching fragile areas such as auth refresh, Markdown sanitization, deployment, or route params, include a short explanation and stronger validation.
