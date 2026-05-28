# WYPark Blog Frontend Renewal Plan

작성일: 2026-05-28

## 1. 목표

이 문서는 현재 `blog-frontend` 코드를 기준으로 개인 블로그 프론트엔드를 대폭 리뉴얼하기 위한 계획이다. 백엔드 API와 데이터 구조는 유지하고, 프론트엔드 라우팅, 컴포넌트 구조, 관리자 UX, 마크다운 렌더링, 시각 디자인을 중심으로 개선한다.

이번 리뉴얼은 기존 기능을 보존하는 마이너 개선이 아니라, 필요하다면 프론트엔드 구조를 넓게 재배치하는 것을 전제로 한다. 개인 블로그이므로 기존 UI 코드는 과감히 갈아엎어도 된다. 단, 인증 토큰 처리, API 경로, 공개 URL, SEO 도메인, 배포 구조처럼 외부 계약에 가까운 부분은 검증 없이 임의 변경하지 않는다.

## 2. 현재 코드 요약

### 기술 스택

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4, `@tailwindcss/typography`
- TanStack React Query, Zustand, Axios
- `react-markdown`, `rehype-sanitize`, `react-syntax-highlighter`
- 글 작성 에디터: `@uiw/react-md-editor`

### 주요 구조

- 전역 레이아웃: `src/app/layout.tsx`
- 홈: `src/app/page.tsx`
- 글 상세: `src/app/posts/[slug]/page.tsx`, `src/components/post/PostDetailClient.tsx`
- 글 작성/수정: `src/app/write/page.tsx`
- 카테고리 페이지: `src/app/category/[id]/page.tsx`
- 아카이브: `src/app/archive/page.tsx`
- 사이드바/상단 헤더: `src/components/layout/Sidebar.tsx`, `src/components/layout/TopHeader.tsx`
- API 래퍼: `src/api/*`
- 인증 상태: `src/store/authStore.ts`

### API 재사용 가능성

백엔드 수정 없이 다음 관리자 기능을 만들 수 있다.

- 게시글 작성/수정/삭제: `createPost`, `updatePost`, `deletePost`
- 게시글 목록 조회/검색/정렬: `getPosts`
- 카테고리 조회/생성/수정/삭제: `getCategories`, `createCategory`, `updateCategory`, `deleteCategory`
- 프로필 조회/수정: `getProfile`, `updateProfile`
- 이미지 업로드: `uploadImage`
- 댓글 조회/삭제: `getComments`, `getAdminComments`, `deleteAdminComment`

## 3. 현재 문제와 개선 방향

### 홈 대시보드가 비어 보임

현재 홈은 공지 3개, 최신 글 3개, 인기 글 3개 정도의 섹션으로 구성되어 있다. `src/app/page.tsx`에서 이미 `getPosts`를 여러 번 호출해 최신순, 조회수순, 공지 목록을 가져오고 있으므로 데이터 기반은 있다. 다만 한 화면에서 읽을 수 있는 정보 밀도가 낮고, 블로그의 현재 상태를 보여주는 대시보드 느낌이 약하다.

개선 방향:

- 최신 글을 6~8개까지 보여주는 리스트 중심 섹션 추가
- 인기 글, 공지, 최근 댓글 또는 카테고리 현황을 보조 패널로 배치
- 전체 글 수, 카테고리 수, 최근 업데이트일 같은 작은 통계 영역 추가
- 검색 결과 화면과 기본 대시보드 화면을 시각적으로 분리
- 공지 글은 별도 스트립 또는 상단 compact list로 처리

### 관리자 기능이 일반 페이지에 섞여 있음

현재 사이드바에서 관리자 권한이면 프로필 수정, 카테고리 생성/삭제/이동 기능이 바로 노출된다. 글 작성 버튼은 상단 헤더에 있고, 글 상세에서는 수정/삭제 버튼이 직접 보인다. 기능은 동작하지만 일반 방문자용 읽기 화면과 관리자 도구가 섞여 있어 UI가 복잡해지고, “블로그를 보는 경험”과 “블로그를 관리하는 경험”이 분리되지 않는다.

개선 방향:

- `/admin` 관리자 설정 페이지 신설
- 관리자 계정 로그인 후에만 `TopHeader` 또는 사이드바 하단에 “관리자 설정” 버튼 노출
- 일반 회원과 비로그인 사용자는 관리자 버튼을 볼 수 없게 처리
- 기존 사이드바의 카테고리 편집 버튼, 프로필 수정 모달 제거
- 카테고리/프로필/댓글/게시글 관리는 `/admin` 내부에서만 수행
- `/write`는 `/admin/posts/new` 또는 `/admin/write`로 편입하는 방향 검토

### 마크다운 렌더링 기능이 제한적임

현재 `MarkdownRenderer`는 `remark-gfm`, `rehype-sanitize`, `rehype-slug`를 사용하고, 코드 블록/표/이미지/헤딩을 직접 커스텀한다. 그러나 `package.json`에는 이미 `remark-math`, `rehype-katex`, `remark-breaks`, `rehype-autolink-headings`, `katex`가 설치되어 있는데 실제 렌더러에서는 사용하지 않는다.

개선 방향:

- GFM, 줄바꿈, 수식, 코드, 표, 체크리스트, 자동 heading anchor를 일관되게 지원
- `rehype-sanitize`는 유지하되, 코드 언어 class, heading id, 링크 속성, KaTeX class를 허용하는 명시적 sanitize schema 구성
- 본문 타이포그래피를 전역 CSS와 Tailwind Typography 기반으로 정리
- 이미지 캡션, 이미지 확대 보기, 외부 링크 아이콘, anchor link 복사를 개선
- TOC는 렌더러의 heading slug 생성 방식과 완전히 같은 유틸리티를 공유

### 디자인이 컴포넌트마다 다소 분산되어 있음

대부분 Tailwind 클래스로 잘 구성되어 있지만, 파란색 중심의 색상, `rounded-2xl`, `shadow-xl`, 카드형 UI가 여러 곳에 반복된다. 블로그 읽기 화면은 미니멀해야 하는데, 카드와 그림자 중심의 요소가 많아 화면별 톤이 약간 다르게 느껴진다.

개선 방향:

- 색상, radius, border, shadow, spacing의 기준을 정하고 반복 컴포넌트화
- Apple 제품 UI에서 느껴지는 정제된 여백, 얇은 경계선, 부드러운 깊이감, 고급스러운 모션을 디자인 기준으로 채택
- 카드 남발을 줄이고, 글 목록/본문/관리자 화면별 밀도를 다르게 설계
- 본문 읽기 영역은 여백과 행간 중심으로 차분하게 구성
- 관리자 화면은 작업 효율 중심의 조밀한 테이블/패널 UI로 구성
- 모바일에서는 사이드바보다 상단/하단 내비게이션 접근성을 우선

### 타입 안정성과 운영 품질 개선 여지

`any`가 API, 페이지, 컴포넌트에 여러 곳 존재한다. 또한 `src/app/posts/[slug]/loding.tsx`는 Next.js가 인식하는 `loading.tsx`가 아니므로 로딩 UI 파일명이 잘못되어 있다. `ReactQueryDevtools`도 현재 `Providers`에서 항상 렌더링된다.

개선 방향:

- `PostSaveRequest`, `PagedResponse<T>`, `AdminComment` 등 누락 타입 추가
- 페이지 메타 구조가 `data.page` 또는 기존 `data` 양쪽에 대응하는 부분을 타입으로 흡수
- `loding.tsx`를 `loading.tsx`로 수정
- React Query Devtools는 개발 환경에서만 렌더링
- 브라우저 기본 `alert`, `confirm`, `prompt`를 주요 관리자 플로우에서 커스텀 모달/토스트로 교체

## 4. 제안하는 정보 구조

### 공개 페이지

```text
/
/archive
/category/[id]
/posts/[slug]
/login
/signup
```

공개 페이지는 읽기 경험을 중심으로 유지한다. 관리자 전용 조작 버튼은 최소화하거나 관리자 페이지로 연결하는 정도로만 둔다.

### 관리자 페이지

```text
/admin
/admin/posts
/admin/posts/new
/admin/posts/[slug]/edit
/admin/categories
/admin/profile
/admin/comments
/admin/settings
```

초기 구현에서는 라우트 수를 줄여 `/admin` 단일 페이지 안의 탭 UI로 시작해도 된다.

권장 MVP:

- `/admin` 대시보드
- `/admin/posts` 게시글 관리 및 작성 버튼
- `/admin/categories` 카테고리 관리
- `/admin/profile` 프로필 관리

댓글 관리는 이후 단계로 분리해도 된다.

## 5. 홈 대시보드 리뉴얼 상세

### 현재 데이터 활용

기존 `getPosts`만으로 다음 데이터를 구성할 수 있다.

- 최신 글: `getPosts({ size: 8, sort: 'createdAt,desc' })`
- 인기 글: `getPosts({ size: 5, sort: 'viewCount,desc' })`
- 공지: `getPosts({ category: '공지', size: 3 })`
- 전체 글 수: 응답의 `totalElements`
- 카테고리: `getCategories()`

### 레이아웃 제안

```text
홈
├─ 상단: 블로그 이름, 짧은 소개, 검색
├─ 공지 스트립: 최신 공지 1~3개
├─ 메인 컬럼: 최신 글 목록 6~8개
├─ 보조 컬럼: 인기 글, 카테고리 요약, 최근 업데이트
└─ 하단: 아카이브 진입, 태그/카테고리 탐색
```

디자인 방향:

- 최신 글은 카드보다 리스트형을 기본으로 하여 정보 밀도 확보
- 대표 글 1개만 살짝 강조하고 나머지는 compact list
- 인기 글은 조회수와 카테고리를 함께 표시
- 공지는 빨간색 강조보다 얇은 라인과 작은 배지로 처리
- 검색 결과 화면에서는 “검색어, 결과 수, 정렬, 목록”만 집중해서 표시

## 6. 관리자 페이지 설계

### 접근 제어

프론트에서는 `useAuthStore`의 `_hasHydrated`와 `role?.includes('ADMIN')`를 기준으로 관리자 버튼과 페이지 접근을 제어한다. 백엔드 admin API가 최종 권한 검사를 담당한다는 전제는 유지한다.

권장 동작:

- 비로그인: `/login?redirect=/admin` 또는 홈으로 이동
- 일반 회원: “관리자 권한이 필요합니다” 토스트 후 홈으로 이동
- 관리자: 관리자 메뉴 노출 및 `/admin` 접근 허용

### 상단 헤더 변경

현재 `TopHeader`는 관리자에게 글쓰기 버튼만 보여준다. 리뉴얼 후에는 다음처럼 바꾼다.

- 비로그인: 로그인, 회원가입
- 일반 회원: 로그아웃
- 관리자: 관리자 설정, 새 글, 로그아웃

“관리자 설정”은 명확히 `/admin`으로 이동한다. 일반 회원에게는 렌더링하지 않는다.

### 사이드바 변경

사이드바는 공개 탐색용으로만 둔다.

제거할 기능:

- 프로필 수정 모달
- 카테고리 편집 모드
- 카테고리 추가/삭제/이동 버튼
- 관리자 전용 hover 편집 버튼

유지할 기능:

- 프로필 표시
- 검색
- 아카이브 링크
- 카테고리 트리 탐색
- Github/Email 링크

### 관리자 대시보드

`/admin` 첫 화면은 운영 현황을 빠르게 보여준다.

추천 위젯:

- 총 게시글 수
- 카테고리 수
- 최근 작성 글 5개
- 인기 글 5개
- 최근 댓글 5~10개
- 빠른 작업: 새 글 작성, 카테고리 관리, 프로필 수정

### 게시글 관리

기존 `/write` 기능을 재사용하되 관리자 흐름으로 재배치한다.

필요 UI:

- 검색/필터/정렬 가능한 게시글 테이블
- 제목, 카테고리, 날짜, 조회수, 작업 버튼
- 새 글 작성 버튼
- 수정 버튼
- 삭제 전 확인 모달

백엔드 유지 조건에서는 공개 `getPosts`를 관리 목록에도 사용한다. 비공개 글 같은 개념이 없다면 별도 admin list API 없이 충분하다.

### 카테고리 관리

사이드바에서 하던 기능을 `/admin/categories`로 이동한다.

필요 UI:

- 트리 형태 카테고리 목록
- 카테고리 생성
- 이름 변경
- 부모 변경 또는 드래그 이동
- 삭제 확인
- 변경 후 `['categories']`, `['posts']` 관련 쿼리 무효화

현재 API는 `updateCategory(id, { name, parentId })` 형식이므로 이름 변경과 이동 모두 가능하다.

### 프로필 관리

현재 사이드바 모달 기능을 `/admin/profile`로 이동한다.

필요 UI:

- 이름, 소개, 이미지, Github URL, Email 편집
- 이미지 업로드
- 미리보기
- 저장 후 프로필 쿼리 무효화

### 댓글 관리

이미 `getAdminComments`와 `deleteAdminComment`가 존재하므로 관리자 화면에 편입할 수 있다.

필요 UI:

- 최근 댓글 목록
- 작성자, 게시글, 내용, 작성일
- 댓글 위치로 이동
- 관리자 삭제

단, `getAdminComments` 반환 타입이 현재 `any`이므로 실제 응답을 확인한 뒤 `AdminComment` 타입을 추가한다.

## 7. 마크다운 렌더러 개선 상세

### 플러그인 구성

권장 파이프라인:

```ts
remarkPlugins={[
  remarkGfm,
  remarkBreaks,
  remarkMath,
]}
rehypePlugins={[
  rehypeSlug,
  [rehypeAutolinkHeadings, { behavior: 'append' }],
  rehypeKatex,
  [rehypeSanitize, customSchema],
]}
```

보안상 `rehype-sanitize`는 반드시 유지한다. 다만 기본 schema가 너무 좁거나 플러그인 class를 제거할 수 있으므로 `customSchema`를 명시한다.

### 지원할 문법

- 제목 anchor 및 TOC 연동
- GFM 표
- 체크리스트
- 취소선
- inline code/code block
- 수식: inline/block KaTeX
- 일반 줄바꿈
- 이미지 캡션
- 외부 링크 새 탭
- 코드 복사

### 본문 스타일

본문은 `MarkdownRenderer` 내부에 모든 스타일을 몰아넣기보다, `globals.css` 또는 전용 `markdown.css`에서 `.markdown-content`를 정리하는 편이 낫다.

권장 스타일:

- 본문 최대 너비: 720~820px
- 한글 행간: `leading-8` 수준
- 문단 간격: 과하지 않게 일정하게
- heading은 큰 장식보다 명확한 계층 중심
- blockquote는 callout처럼 보이되 색상 과다 사용 금지
- code block은 가로 스크롤과 긴 줄 처리를 안정화
- table은 모바일 overflow 대응

### TOC 개선

현재 TOC는 마크다운 원문을 정규식으로 다시 파싱한다. 렌더러와 TOC가 서로 다른 방식으로 heading을 만들 수 있으므로 slug 생성 유틸을 공유한다.

개선안:

- `src/utils/markdown.ts` 추가
- `extractHeadings(content)` 제공
- `MarkdownRenderer`와 `TOC`가 같은 slug 생성 규칙 사용
- h1~h3 또는 h2~h3만 표시할지 정책 결정

## 8. 디자인 시스템 방향

### 디자인 레퍼런스

전체 디자인 방향은 Apple의 제품 UI와 웹사이트에서 느껴지는 미니멀하고 정제된 스타일을 참고한다. 단, Apple의 로고, 아이콘, 제품 이미지, 고유한 브랜드 표현을 직접 복제하지 않고, 다음 원칙을 블로그 맥락에 맞게 재해석한다.

- 넓고 명확한 여백
- 얇은 선과 낮은 대비의 경계
- 과장되지 않은 입체감
- 선명한 타이포그래피 위계
- 부드러운 전환과 즉각적인 피드백
- 불필요한 장식보다 콘텐츠 자체를 돋보이게 하는 구성
- 모바일과 데스크톱 모두에서 손에 익은 네이티브 앱 같은 조작감

### 전체 톤

목표는 “Apple-inspired 미니멀 블로그”다. 화면은 깨끗하고 조용하지만 비어 보이지 않아야 하며, 정보는 정돈된 레이어와 타이포그래피로 충분히 채운다.

키워드:

- Apple-inspired
- 조용한 대비
- 선명하고 큰 타이포그래피
- 적당한 정보 밀도
- 적은 장식
- 빠른 탐색
- 부드러운 물성
- 정제된 인터랙션

### 색상

현재 파란색이 대부분의 강조 색으로 쓰인다. Apple 스타일을 참고해 흰색, off-white, neutral gray를 넓게 사용하고, 파란색은 주요 액션과 링크에만 선명하게 사용한다. 전체 화면이 파란색 테마처럼 보이지 않도록 중립색을 기본값으로 둔다.

권장:

- 배경: white, near-white, neutral-50 계열
- 본문 텍스트: neutral/slate 계열의 높은 가독성 색상
- 보조 텍스트: neutral-400~500 계열
- 링크/주요 액션: Apple blue에 가까운 명확한 blue 계열
- 위험 액션: red 계열을 작고 단호하게 사용
- 성공/저장 완료: green 계열을 토스트/상태 표시에 제한적으로 사용
- 공지: red 대신 amber 또는 muted red를 작은 배지/라인으로 제한 사용

### Radius와 Shadow

읽기 화면은 큰 radius와 강한 shadow를 줄인다. Apple UI처럼 표면이 떠 있는 느낌은 주되, 그림자가 먼저 보이지 않게 한다. 깊이감은 `border`, 배경 레이어, 아주 약한 shadow, blur가 있는 overlay로 만든다.

권장:

- 일반 버튼/입력: `rounded-lg` 또는 pill 형태
- 목록 아이템: `rounded-md` 또는 border-only
- 모달/드롭다운: `rounded-xl`
- 반복 카드: shadow보다 border와 hover background 중심
- floating panel: 얇은 border + 약한 shadow + 흰색/반투명 배경
- destructive dialog: 시각적으로 단호하되 과한 빨간 배경은 피함

### Typography

Apple 스타일의 핵심은 장식보다 타이포그래피의 밀도와 리듬이다. 블로그에서는 글 제목, 섹션 제목, 본문, 보조 정보의 위계를 선명히 나누고, 한글 가독성을 우선한다.

권장:

- 큰 제목은 과감하게 쓰되 한 화면에 너무 많은 hero 텍스트를 두지 않음
- 본문은 16~18px, 넉넉한 행간, 적절한 문단 간격 유지
- 날짜/조회수/카테고리 같은 메타 정보는 작고 차분하게 처리
- 버튼 라벨은 짧게 유지하고 아이콘과 함께 사용
- letter spacing은 기본값에 가깝게 두고, 한글에 과한 자간을 적용하지 않음

### Motion

인터랙션은 빠르고 조용해야 한다. Apple UI처럼 화면 전환, hover, active, modal open/close에 미세한 움직임을 주되, 블로그 읽기를 방해하는 큰 애니메이션은 피한다.

권장:

- hover: 배경색 변화, 살짝 올라감, 아주 약한 shadow
- active: 짧은 scale down 또는 색상 변화
- modal/sheet: fade + subtle scale/slide
- sidebar/mobile menu: 부드러운 slide
- skeleton/loading: 과하게 번쩍이지 않는 pulse
- motion duration: 150~250ms 중심

### 레이아웃

데스크톱:

- 좌측 사이드바 유지
- 본문은 route별 최대 너비 분리
- 홈은 2-column 대시보드
- 글 상세는 본문 + 우측 TOC
- 관리자 화면은 macOS 설정 앱처럼 좌측 섹션 내비게이션 + 우측 상세 패널 구조 우선 검토

모바일:

- 사이드바 토글을 유지하되 탐색 경험 단순화
- 관리자 페이지는 탭/섹션을 세로 스택으로
- 글 목록은 리스트형 우선
- 버튼 라벨이 줄바꿈되어도 깨지지 않게 고정 폭/반응형 처리
- 주요 액션은 터치 타겟을 충분히 확보하고, 하단 sheet/compact menu 패턴을 적극 사용

## 9. 코드 구조 리팩터링 제안

### 새 디렉터리

```text
src/components/admin/
src/components/common/
src/components/markdown/
src/components/post/list/
src/lib/
src/utils/
```

### 주요 분리 대상

- `Sidebar.tsx`: 공개 사이드바와 관리자 기능 분리
- `TopHeader.tsx`: auth action과 admin entry 분리
- `write/page.tsx`: 에디터 로직, 임시저장, 이미지 업로드, 카테고리 선택을 컴포넌트로 분리
- `MarkdownRenderer.tsx`: 렌더러, 코드 블록, 이미지, 링크, sanitize schema 분리
- `PostCard`/`PostListItem`: 목록 UI 변형을 통합 또는 명확히 분리

### 타입 보강

추가 권장 타입:

```ts
interface PageMeta {
  totalPages: number;
  totalElements: number;
  number?: number;
  last?: boolean;
}

interface PostSaveRequest {
  title: string;
  content: string;
  categoryId: number;
  tags: string[];
}

interface AdminComment {
  id: number;
  content: string;
  author: string;
  postSlug?: string;
  postTitle?: string;
  createdAt: string;
}
```

## 10. 단계별 실행 계획

### Phase 0. 기준선 정리

- `npm ci`로 의존성 설치
- `npm run lint`, `npm run build` 현재 상태 확인
- `src/app/posts/[slug]/loding.tsx` 파일명 오류 확인 후 수정 계획 반영
- `ReactQueryDevtools` 개발 환경 조건부 렌더링 계획 반영
- 현재 화면 스크린샷 기록

### Phase 1. 관리자 진입점과 라우트 신설

- `/admin` 라우트 추가
- 관리자 가드 컴포넌트 추가
- `TopHeader`에 관리자 설정 버튼 추가
- 일반 회원/비로그인에서는 관리자 버튼 비노출
- `robots.ts`의 `/admin` 차단 유지

### Phase 2. 공개 사이드바 정리

- `Sidebar`에서 관리자 편집 상태 제거
- 카테고리 편집/프로필 수정 로직을 관리자 컴포넌트로 이동
- 사이드바는 탐색, 검색, 프로필 표시만 담당
- 모바일 사이드바 열림 기본값과 overlay UX 점검

### Phase 3. 관리자 기능 구현

- 관리자 대시보드 카드/리스트 구현
- 게시글 관리 목록 구현
- 기존 글쓰기 화면을 관리자 작성/수정 흐름으로 연결
- 카테고리 관리 화면 구현
- 프로필 관리 화면 구현
- 댓글 관리 화면은 응답 타입 확인 후 구현

### Phase 4. 홈 대시보드 리뉴얼

- 최신 글 중심 레이아웃으로 개편
- 공지/인기글/카테고리 요약 패널 추가
- 검색 결과 모드 재정리
- 빈 상태, 로딩 상태, 오류 상태 디자인 통일

### Phase 5. 마크다운 렌더러 개선

- markdown 관련 컴포넌트와 유틸 분리
- `remark-breaks`, `remark-math`, `rehype-katex`, `rehype-autolink-headings` 적용
- sanitize schema 확장
- 본문 CSS 정리
- TOC slug 공유
- 코드/표/이미지/수식/체크리스트 테스트 글로 검증

### Phase 6. 디자인 폴리싱

- 버튼, 입력, 모달, 리스트, 배지 공통 스타일 정리
- 카드 그림자와 radius 정리
- 모바일 레이아웃 검증
- 한국어 문구 톤 통일
- 접근성: label, aria-label, focus ring, keyboard navigation 점검

### Phase 7. 검증과 배포 전 점검

- `npm run lint`
- `npm run build`
- 로컬 dev 서버에서 핵심 플로우 확인
- 관리자 계정/일반 계정/비로그인 상태별 UI 확인
- 백엔드 미연결 상태에서 graceful loading/error 확인
- 배포 환경 `NEXT_PUBLIC_API_URL` 확인

## 11. 검증 체크리스트

### 인증/권한

- 비로그인 사용자는 관리자 버튼을 볼 수 없다.
- 일반 회원은 관리자 버튼을 볼 수 없다.
- 관리자만 `/admin`에 접근할 수 있다.
- 관리자 API 실패 시 토큰이나 민감 정보가 노출되지 않는다.

### 공개 화면

- 홈이 비어 보이지 않고 최신 글 목록이 충분히 보인다.
- 검색 결과가 명확하게 분리되어 보인다.
- 카테고리 페이지의 grid/list 전환이 유지된다.
- 글 상세의 본문 너비와 TOC 위치가 안정적이다.
- 모바일에서 사이드바와 상단 버튼이 겹치지 않는다.

### 관리자 화면

- 게시글 작성/수정/삭제 후 관련 쿼리가 갱신된다.
- 카테고리 생성/수정/삭제/이동 후 사이드바가 갱신된다.
- 프로필 저장 후 공개 사이드바가 갱신된다.
- 삭제 액션은 확인 모달을 거친다.
- 로딩/비활성/오류/성공 상태가 모두 보인다.

### 마크다운

- heading anchor와 TOC가 같은 위치로 이동한다.
- 코드 블록 언어 표시와 복사가 동작한다.
- 표가 모바일에서 깨지지 않는다.
- 이미지가 본문 폭을 넘지 않는다.
- 수식이 렌더링된다.
- 악성 HTML/script는 sanitize된다.

## 12. 우선순위

가장 먼저 할 일:

1. `/admin` 라우트와 관리자 버튼 추가
2. 사이드바 관리자 기능 제거 및 관리자 페이지로 이동
3. 홈 대시보드 정보 밀도 개선
4. 마크다운 렌더러 개선
5. 디자인 토큰/공통 컴포넌트 정리

리뉴얼 체감이 가장 큰 조합은 “관리자 기능 분리 + 홈 대시보드 개편 + 본문 타이포그래피 개선”이다. 이 세 가지를 먼저 끝내면 블로그가 보는 화면과 관리하는 화면 모두에서 확실히 달라진다.

## 13. 확인된 현재 검증 상태

현재 로컬에 `node_modules`가 없어 `npm run lint`는 실행되지 않았다. 오류는 다음과 같다.

```text
'eslint' is not recognized as an internal or external command
```

리뉴얼 작업을 시작하기 전 `npm ci`로 의존성을 설치한 뒤 lint/build 기준선을 먼저 잡는 것이 좋다.
