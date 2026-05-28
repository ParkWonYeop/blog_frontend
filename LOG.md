# LOG.md

## 2026-05-28

- `npx getdesign@latest add apple`로 Apple 참고용 `DESIGN.md`를 추가했다.
- `ThemeProvider`/`ThemeToggle`을 추가해 `wyp-theme-mode` 기반 `라이트/시스템/다크` 3단 토글을 TopHeader 우측에 배치했다.
- `html[data-theme]`, `html[data-theme-mode]` DOM 계약과 beforeInteractive 초기화 스크립트를 추가해 강제 라이트/다크와 시스템 설정 따르기를 분리했다.
- 전역 폰트를 Apple 우선 sans/mono stack으로 정리하고, Tailwind `dark:` variant를 `data-theme="dark"` 기준으로 전환했다.
- 홈, 아카이브, 카테고리, 로그인/회원가입, 글 상세, 댓글, 관리자 shell/dashboard 일부 surface를 Apple/macOS식 토큰과 control 색상으로 맞췄다.
- 검증: `npm run lint` 통과, `npm run build` 통과. build 중 sitemap fetch는 sandbox 네트워크 제한으로 기존처럼 경고를 출력했지만 실패하지 않았다. `NEXT_PUBLIC_API_URL=https://blogserver.wypark.me npm run dev` 후 Browser로 `/`, `/archive`, `/category/잡담`, `/posts/rtr-(refresh-token-rotation)`, `/login`, 로그아웃 상태 `/admin` 리다이렉트와 테마 전환/새로고침 유지 동작을 확인했다. localhost에서 배포 API를 직접 호출하는 카테고리 데이터는 백엔드 접근 제한으로 에러 상태 UI를 확인했다.
- 다음 추천 작업: 실제 배포 Origin에서 테마 토글 저장값과 관리자 로그인 상태의 하위 관리 화면 hover/focus를 최종 확인한다.

## 2026-05-28

- `docs/apple-style-frontend-development-guide.md` Phase 1 + Phase 2 기준으로 Apple 스타일 1차 MVP 프론트 리뉴얼을 적용했다.
- 전역 디자인 토큰과 작은 UI 컴포넌트(`Surface`, `StatusBadge`, `SegmentedControl`, `MetricCard`, `EmptyState`)를 추가했다.
- 공개 홈을 intro, notice, featured/latest, category shelves, popular reading, archive CTA 구조로 재구성하고 공개 운영 집계 노출을 피했다.
- 사이드바, 카드/list item, 아카이브, 글 상세, Markdown renderer, TOC의 영어 UI와 표면/본문 폭/간격을 한국어 중심 Apple 스타일로 정리했다.
- 관리자 dashboard 타입과 `getAdminDashboard()` API wrapper를 추가하고, `/admin`에 KPI, 트래픽 차트, 액션 센터, 콘텐츠 성과, 최근 활동, 카테고리 상태 골격과 fallback UI를 구현했다.
- 검증: `npm run build` 통과. `npm run lint`는 기존 baseline(`src/api/http.ts`, `src/app/signup/page.tsx`, `src/app/sitemap.ts`, 댓글 컴포넌트, `src/store/authStore.ts`, `tailwind.config.ts`) 오류로 실패하지만 이번에 수정한 파일의 lint 오류는 없음. Browser로 `/`, `/?keyword=test`, `/archive`, 로그아웃 상태 `/admin` 리다이렉트를 확인했고 콘솔 에러는 없었다.
- 다음 추천 작업: 기존 lint baseline을 먼저 정리한 뒤, 백엔드 `/api/admin/dashboard` 구현과 실제 관리자 계정 상태에서 dashboard range 전환을 검증한다.

## 2026-05-28

- 기존 lint baseline을 정리했다.
- `src/api/http.ts`의 토큰 refresh queue, Web Locks 접근, localStorage 파싱을 명시 타입으로 좁혔다.
- providers, signup, sitemap, comment, auth store, Tailwind config의 unused 변수와 `any`/CommonJS import lint 오류를 정리했다.
- 검증: `npm run lint` 통과, `npm run build` 통과. build 중 sitemap fetch는 백엔드/네트워크 제한으로 기존처럼 경고를 출력하지만 실패하지 않는다.
- 다음 추천 작업: 실제 관리자 계정으로 `/admin` 대시보드 fallback과 range control을 확인하고, 백엔드 `/api/admin/dashboard` 구현을 연결한다.

## 2026-05-28

- 배포 백엔드(`https://blogserver.wypark.me`) 기준으로 공개 posts/categories/category 필터 API 연결을 확인했다.
- `GET /api/admin/dashboard?range=30d&timezone=Asia/Seoul`는 미인증 상태에서 `403`을 반환하고, 배포 프론트 Origin(`https://blog.wypark.me`) + Authorization preflight는 허용됨을 확인했다.
- 실제 posts 응답에 포함되는 `updatedAt`을 `Post` 타입에 반영했다.
- `NEXT_PUBLIC_API_URL=https://blogserver.wypark.me npm run build`를 네트워크 허용 상태로 실행해 sitemap fetch까지 포함한 production build를 검증했다.
- 검증: `npm run lint` 통과, `NEXT_PUBLIC_API_URL=https://blogserver.wypark.me npm run build` 통과. 로컬 `localhost:3000`에서 배포 API를 직접 붙이는 브라우저 검증은 백엔드 CORS 정책상 `https://blog.wypark.me`만 허용되어 제한된다.
- 다음 추천 작업: 프론트 배포 후 `https://blog.wypark.me/admin`에서 실제 관리자 로그인 상태로 dashboard 실데이터 렌더링과 range 전환을 최종 확인한다.

## 2026-05-28

- Browser로 배포 블로그(`https://blog.wypark.me`)를 직접 둘러보고 대표글 카드가 비어 보이는 현상, 검색 입력/로그인/관리자 하위 화면의 다크모드 누락을 확인했다.
- 대표글이 1개뿐일 때 최신 글 패널이 빈 영역처럼 보이지 않도록 홈 featured/latest 레이아웃을 조정했다.
- 검색 입력, 로그인 화면, 댓글 UI를 토큰 기반 surface/text/input 스타일로 정리했다.
- 관리자 게시글/댓글/카테고리/프로필처럼 기존 Tailwind neutral class를 쓰는 화면도 다크모드에서 깨지지 않도록 전역 dark compatibility 레이어를 보강했다.
- 검증: `npm run lint` 통과, `npm run build` 통과. build 중 sitemap fetch는 샌드박스 네트워크 제한으로 경고가 출력됐지만 exit 0으로 완료됐다. `npm run dev` 후 Browser로 `/`, `/?keyword=network`, `/login`, 로그아웃 상태 `/admin` 리다이렉트, 관리자 하위 화면 로컬 미리보기를 확인했다.
- 다음 추천 작업: 프론트 배포 후 실제 관리자 로그인 상태에서 `/admin/posts`, `/admin/comments`, `/admin/categories`, `/admin/profile`의 데이터 로딩 상태와 다크모드 hover/focus를 production Origin에서 최종 확인한다.
