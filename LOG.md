# LOG.md

## 2026-05-28

- 상단 메뉴의 관리자 `새 글` 버튼이 라이트/다크 모드에서 흑백 반전처럼 보이지 않도록 accent 색상 기반 primary 버튼으로 고정했다.
- 검증: `npm run lint` 통과, `npm run build` 통과. build 중 sitemap fetch는 로컬 네트워크 제한으로 기존처럼 경고를 출력했지만 실패하지 않았다.
- 다음 추천 작업: 실제 관리자 로그인 상태에서 상단 메뉴를 열어 `새 글` 버튼 대비가 라이트/다크 모두 자연스러운지 확인한다.

## 2026-05-28

- 홈 상단 히어로의 `박원엽의 개발 기록` 제목과 소개 문구를 제거하고, `전체 글` CTA는 유지했다.
- 접근성을 위해 시각적으로 숨긴 홈 제목만 유지했다.
- 검증: `npm run lint` 통과, `npm run build` 통과. build 중 sitemap fetch는 로컬 네트워크 제한으로 기존처럼 경고를 출력했지만 실패하지 않았다. Browser로 홈에서 제목/소개 문구가 보이지 않는 것을 확인했다.
- 다음 추천 작업: 배포 후 실데이터가 들어온 홈 첫 화면에서 상단 여백이 과하지 않은지 확인한다.

## 2026-05-28

- 홈 대표 글 영역을 제거하고 조회수 내림차순 `viewCount,desc` 기준 인기 글 5개 패널로 대체했다.
- 인기 글과 최신 글을 같은 `lg:grid-cols-2` 반반 레이아웃으로 맞추고, 인기 글에는 순위와 조회수를 작은 보조 메타로 표시했다.
- 검증: `npm run lint` 통과, `npm run build` 통과. build 중 sitemap fetch는 로컬 네트워크 제한으로 기존처럼 경고를 출력했지만 실패하지 않았다. Browser에서 홈의 인기 글/최신 글 반반 레이아웃을 확인했다. 로컬 `localhost:3000`에서 배포 API 호출은 CORS 정책상 실데이터가 비어 보여 production Origin 배포 후 실데이터 렌더링 확인이 필요하다.
- 다음 추천 작업: 배포 후 `https://blog.wypark.me` 홈에서 인기 글 5개가 조회수 순으로 보이는지 확인한다.

## 2026-05-28

- 상단 우측의 테마 토글, 로그인/회원가입, 관리자/새 글/로그아웃 액션을 작은 메뉴 버튼 뒤로 숨기고, 클릭 시 왼쪽으로 펼쳐지는 패널 애니메이션으로 노출되도록 수정했다.
- 메뉴 바깥 클릭과 Escape 키로 닫히게 하고, 링크 이동/로그아웃 시 메뉴가 닫히도록 정리했다.
- 검증: `npm run lint` 통과, `npm run build` 통과. build 중 sitemap fetch는 로컬 네트워크 제한으로 기존처럼 경고를 출력했지만 실패하지 않았다. Browser로 데스크톱/모바일 홈에서 닫힘 상태와 펼침 상태를 확인했다.
- 다음 추천 작업: 실제 로그인/관리자 상태에서 펼침 패널의 버튼 수가 늘어났을 때 모바일 폭에서 자연스럽게 보이는지 production Origin에서 확인한다.

## 2026-05-28

- Pretendard Variable WOFF2를 `src/app/fonts`에 self-host로 추가하고 `next/font/local`로 전역 적용했다.
- 홈을 Apple editorial 톤으로 정리해 히어로, 공지, 대표 글, 최신 글 중심으로 줄이고 최근 업데이트/카테고리 선반/인기 글/하단 아카이브 CTA를 제거했다.
- TopHeader와 ThemeToggle을 아이콘 중심의 조용한 컨트롤로 낮추고, Sidebar는 모바일 기본 닫힘 + 오버레이 drawer로 바꿨다.
- 카드/Surface 그림자와 `읽기` 같은 보조 문구를 줄이고, 글 상세의 조회수 메타와 TOC 카드감을 덜어 본문 집중도를 높였다.
- 검증: `npm run lint` 통과, `npm run build` 통과. build 중 sitemap fetch는 로컬 네트워크 제한으로 기존처럼 경고를 출력했지만 실패하지 않았다. Browser로 `http://localhost:3000/`, 모바일 홈/drawer, `/?keyword=network`, `/archive`, production API 환경의 `/posts/rtr-(refresh-token-rotation)`을 확인했고 Pretendard computed font 적용을 확인했다. 로컬 기본 API 상태에서는 posts/categories 데이터가 비어 보일 수 있어 production API 환경으로 글 상세를 추가 확인했다.
- 다음 추천 작업: 배포 후 실제 Origin에서 홈 실데이터 카드 밀도와 모바일 상단 컨트롤 간격을 한 번 더 확인한다.

## 2026-05-28

- 홈의 `전체 글 둘러보기` CTA가 라이트/다크에서 반전 색상처럼 보이지 않도록 `color-text`/`dark:bg-white` 조합을 제거하고 Apple action blue 토큰으로 통일했다.
- 검증: `npm run lint` 통과.
- 다음 추천 작업: 배포 후 홈 첫 화면에서 primary/secondary CTA 대비가 라이트/다크 모두 자연스러운지 최종 확인한다.

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
