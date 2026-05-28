# Apple 스타일 프론트엔드 리뉴얼 개발 문서

작성일: 2026-05-28

대상 저장소: `blog-frontend`

## 1. 목표

WYPark Blog의 공개 화면과 관리자 화면을 Apple의 macOS/iOS에서 느껴지는 정돈된 UI 방향으로 개선한다. 단순히 둥근 카드와 흐림 효과를 추가하는 것이 아니라, 콘텐츠를 읽는 화면은 조용하고 고급스럽게, 관리자 화면은 밀도 있는 운영 도구처럼 설계한다.

이번 문서는 프론트엔드를 먼저 개발할 수 있도록 백엔드 예정 엔드포인트까지 미리 정의한다. 백엔드 API가 아직 없더라도 프론트는 타입, API 래퍼, 로딩/빈 상태, 임시 fallback을 먼저 구현할 수 있어야 한다.

중요한 원칙:

- 공개 홈 화면에는 하루 조회수, 일주일 조회수, 한달 조회수 같은 운영 집계를 노출하지 않는다.
- 조회수 집계와 콘텐츠 성과 모니터링은 `/admin` 대시보드에서만 보여준다.
- 공개 화면은 방문자가 글을 찾고 읽는 경험에 집중한다.
- 관리자 화면은 운영자가 오늘 확인할 일과 콘텐츠 성과를 빠르게 보는 경험에 집중한다.

## 2. 현재 화면 진단

실제 배포 사이트 `https://blog.wypark.me` 기준으로 확인한 내용이다.

### 장점

- 왼쪽 고정 사이드바, 홈 카드 그리드, 글 상세 TOC, 아카이브 타임라인, 카테고리 카드/리스트 전환 등 기본 정보 구조가 이미 갖춰져 있다.
- 글 상세 페이지는 이미지, 목차, 이전/다음 글, 댓글까지 블로그 핵심 기능을 포함한다.
- 관리자 라우트가 `/admin`, `/admin/posts`, `/admin/comments`, `/admin/categories`, `/admin/profile`로 분리되어 있어 확장하기 좋다.

### 개선이 필요한 점

- 전체 UI가 매우 옅고 넓게 펼쳐져 콘텐츠의 중심감이 약하다.
- 홈 카드들이 비슷한 무게로 배치되어 첫 방문자가 무엇을 먼저 봐야 할지 흐릿하다.
- `Read more`, `views`, `ON THIS PAGE`, `Archives`, `CATEGORIES`처럼 영어 UI가 한국어 콘텐츠와 섞여 있다.
- 글 상세 본문 줄 길이가 길어 장문 읽기에서 시선 이동이 커진다.
- 관리자 화면은 기본 통계와 최근 목록은 있지만, 운영자가 매일 들어와 확인할 만한 지표와 할 일이 부족하다.

## 3. 디자인 방향

### 3.1 Apple 스타일 해석

이 프로젝트에서의 Apple 스타일은 다음 키워드로 해석한다.

- 선명한 위계: 제목, 메타, 본문, 보조 설명의 크기와 색을 명확히 구분한다.
- 부드러운 재질감: 흰색 또는 어두운 반투명 surface, 얇은 border, 절제된 shadow, `backdrop-blur`를 사용한다.
- 정교한 여백: 큰 빈 공간이 아니라 목적 있는 여백을 둔다.
- 조용한 색: 기본은 neutral 계열, 액션과 현재 상태에만 blue tint를 사용한다.
- 익숙한 컨트롤: segmented control, icon button, toolbar, list row, sidebar, sheet, toast 같은 OS 친화 패턴을 사용한다.
- 가벼운 모션: hover, pressed, page transition은 120-180ms 수준으로 짧게 처리한다.

과하게 피해야 할 것:

- 큰 마케팅형 hero
- 장식용 gradient blob
- 과한 glassmorphism
- 카드 안의 카드 중첩
- 모든 요소가 파란색으로 보이는 단색 UI
- 공개 블로그에 운영 통계 노출

### 3.2 디자인 토큰

Tailwind CSS 4를 유지하되, 반복되는 스타일은 작은 컴포넌트와 CSS 변수로 정리한다.

권장 전역 토큰:

```css
:root {
  --color-page: #f5f5f7;
  --color-surface: rgba(255, 255, 255, 0.78);
  --color-surface-strong: #ffffff;
  --color-line: rgba(0, 0, 0, 0.08);
  --color-text: #1d1d1f;
  --color-text-muted: #6e6e73;
  --color-text-subtle: #86868b;
  --color-accent: #007aff;
  --color-accent-soft: rgba(0, 122, 255, 0.1);
  --shadow-panel: 0 18px 50px rgba(0, 0, 0, 0.08);
  --shadow-card: 0 10px 28px rgba(0, 0, 0, 0.06);
}
```

다크 모드는 나중에 확장하더라도 토큰 구조는 미리 다크 대응이 가능하게 둔다.

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-page: #0b0b0c;
    --color-surface: rgba(28, 28, 30, 0.72);
    --color-surface-strong: #1c1c1e;
    --color-line: rgba(255, 255, 255, 0.1);
    --color-text: #f5f5f7;
    --color-text-muted: #a1a1a6;
    --color-text-subtle: #8e8e93;
    --color-accent: #0a84ff;
    --color-accent-soft: rgba(10, 132, 255, 0.16);
    --shadow-panel: 0 18px 50px rgba(0, 0, 0, 0.36);
    --shadow-card: 0 10px 28px rgba(0, 0, 0, 0.28);
  }
}
```

권장 Tailwind 패턴:

```tsx
const surfaceClass =
  'border border-black/5 bg-white/75 shadow-[0_18px_50px_rgba(0,0,0,0.08)] backdrop-blur-xl';

const controlClass =
  'inline-flex h-9 items-center justify-center rounded-full border border-black/10 bg-white/70 px-3 text-sm font-medium text-gray-700 transition hover:bg-white';
```

### 3.3 타이포그래피

폰트는 별도 웹폰트보다 시스템 폰트를 우선한다.

권장 font-family:

```css
font-family:
  -apple-system,
  BlinkMacSystemFont,
  "SF Pro Display",
  "SF Pro Text",
  "Apple SD Gothic Neo",
  "Noto Sans KR",
  system-ui,
  sans-serif;
```

본문 기준:

- 글 상세 본문 최대 폭: 760-820px
- 글 상세 `h1`: 40-48px desktop, 30-34px mobile
- 글 상세 본문: 16-17px, line-height 1.8 전후
- 카드 제목: 17-20px
- 메타 텍스트: 12-13px
- 버튼 텍스트: 13-14px, font-semibold

한국어 문장에서는 letter-spacing을 음수로 줄이지 않는다.

## 4. 공개 홈 화면 개선안

홈 화면은 풍성해져야 하지만 운영 통계는 숨긴다. 방문자에게 필요한 것은 블로그의 주제, 최신 글, 대표 글, 카테고리 탐색, 아카이브 진입이다.

### 4.1 홈 화면 목표

- 블로그 주인이 어떤 글을 쓰는지 첫 화면에서 알 수 있게 한다.
- 최신 글과 대표 글을 분명하게 구분한다.
- 공지는 작지만 놓치지 않게 만든다.
- 카테고리와 아카이브 탐색을 쉽게 한다.
- 조회수 집계, 운영 지표, 일간/주간/월간 트래픽은 공개 홈에 노출하지 않는다.

### 4.2 추천 레이아웃

```text
/
├─ Intro band
│  ├─ 프로필 요약
│  ├─ 블로그 한 줄 소개
│  └─ 검색 CTA
├─ Notice strip
│  └─ 최신 공지 1-3개
├─ Featured + Latest
│  ├─ 대표 글 1개
│  └─ 최신 글 compact list 5-7개
├─ Category shelves
│  ├─ 개발 공부
│  ├─ 잡담
│  └─ 공지
├─ Popular reading
│  └─ 인기 글 목록, 단 공개 화면에서는 누적 조회수 숫자 노출은 선택사항
└─ Archive preview
   └─ 최근 월별 글 흐름과 아카이브 링크
```

### 4.3 홈 섹션 상세

#### Intro band

역할:

- 현재 사이드바 프로필만으로는 홈 중앙의 첫인상이 약하므로, 콘텐츠 영역 상단에도 블로그 정체성을 짧게 보여준다.

구성:

- `박원엽의 개발 기록`
- 짧은 소개 문장: `백엔드, 네트워크, 운영 경험을 정리하는 개인 기술 블로그`
- 검색 입력 또는 `전체 글 둘러보기` 버튼
- 최신 업데이트 날짜

주의:

- hero처럼 과하게 크게 만들지 않는다.
- 첫 viewport에 최신 글 일부가 보이도록 높이를 제한한다.

#### Notice strip

역할:

- 공지를 상단에 노출하되 홈 전체를 차지하지 않게 한다.

구성:

- `공지` badge
- 공지 제목
- 날짜
- 우측 chevron

스타일:

- 연한 red tint 또는 system pink tint
- 얇은 border
- hover 시 surface 강조

#### Featured post

역할:

- 최신 글 중 첫 번째 또는 운영자가 지정한 대표 글을 강조한다.

백엔드에 대표 글 개념이 아직 없다면 1차는 최신 글 첫 번째를 사용한다.

구성:

- 카테고리 badge
- 제목
- 2-3줄 요약
- 날짜
- `읽기` 버튼

향후 백엔드 확장:

- `featured` boolean 또는 `pinnedRank` 필드 추가 가능
- 이 문서의 MVP에서는 필수 아님

#### Latest list

역할:

- 현재 카드 3개보다 더 많은 최신 글을 빠르게 훑게 한다.

구성:

- 최신 글 6-8개
- 각 row: 제목, 카테고리, 날짜, 짧은 요약 또는 없음

스타일:

- macOS list row처럼 한 줄 또는 두 줄 중심
- 각 row는 얇은 divider
- hover 시 `bg-black/[0.03]` 또는 다크 대응 surface

#### Category shelves

역할:

- 카테고리 트리가 사이드바에만 있어 중앙 콘텐츠에서는 탐색 힌트가 약하다.

구성:

- 주요 카테고리 3-6개
- 카테고리명
- 최근 글 2-3개
- 전체 보기 링크

데이터:

- 1차는 `getCategories()`와 카테고리별 `getPostsByCategory(categoryName, 0, 3)` 사용
- 너무 많은 요청이 부담되면 상위 카테고리 3개만 요청
- 백엔드가 나중에 `GET /api/posts/grouped-by-category`를 제공하면 교체 가능

#### Archive preview

역할:

- 글이 100개 이상 있는 블로그의 자산을 보여준다.

구성:

- 최근 12개월의 월별 발행 수
- `아카이브에서 102개 글 보기`

데이터:

- 1차는 `/archive` 페이지로 유도만 한다.
- 월별 발행 수는 백엔드 대시보드 API가 아니라 공개 홈용 별도 API가 필요할 때만 추가한다.
- 공개 통계에는 조회수 집계를 포함하지 않는다.

### 4.4 공개 홈에서 사용 가능한 기존 API

```http
GET /api/posts?page=0&size=8&sort=createdAt,desc
GET /api/posts?page=0&size=5&sort=viewCount,desc
GET /api/posts?page=0&size=3&category=공지&sort=createdAt,desc
GET /api/posts?page=0&size=3&category={categoryName}&sort=createdAt,desc
GET /api/categories
GET /api/profile
```

주의:

- `sort=viewCount,desc`로 인기 글은 만들 수 있지만, 공개 홈에서는 `조회수 123`처럼 숫자를 강조하지 않는다.
- 공개 홈에 `todayViews`, `weekViews`, `monthViews`를 표시하지 않는다.

## 5. 관리자 대시보드 개선안

관리자 대시보드는 `/admin`에 위치한다. 공개 블로그와 달리 정보 밀도를 높이고 운영 행동을 바로 이어갈 수 있게 한다.

### 5.1 관리자 대시보드 목표

- 오늘 블로그가 어떻게 움직이는지 확인한다.
- 최근 7일, 30일 기준으로 트래픽 흐름을 본다.
- 어떤 글을 관리해야 하는지 알려준다.
- 댓글과 카테고리 상태를 빠르게 확인한다.
- 새 글 작성, 댓글 관리, 카테고리 정리로 바로 이동한다.

### 5.2 추천 레이아웃

```text
/admin
├─ Dashboard header
│  ├─ 오늘 날짜
│  ├─ 마지막 집계 시각
│  └─ 새 글 작성 / 게시글 관리 quick actions
├─ KPI cards
│  ├─ 오늘 조회수
│  ├─ 최근 7일 조회수
│  ├─ 최근 30일 조회수
│  └─ 총 게시글 / 총 댓글 / 카테고리
├─ Traffic trend
│  └─ 최근 30일 일별 조회수 chart
├─ Content performance
│  ├─ 최근 7일 인기 글
│  ├─ 상승 중인 글
│  └─ 오래 업데이트 안 된 인기 글
├─ Action center
│  ├─ 답변 필요한 댓글
│  ├─ 미분류 글
│  └─ 오래 방치된 글
├─ Recent activity
│  ├─ 최근 글
│  └─ 최근 댓글
└─ Category health
   └─ 카테고리별 글 수, 조회수, 최근 발행일
```

### 5.3 KPI 카드

필수 KPI:

- 오늘 조회수
- 최근 7일 조회수
- 최근 30일 조회수
- 총 게시글
- 총 댓글
- 카테고리 수

표현:

- 큰 숫자
- 전 기간 대비 변화율
- 작은 sparkline 또는 방향 badge

예:

```text
오늘 조회수
311
어제보다 +12.4%
```

API가 준비되지 않았을 때:

- 오늘/7일/30일 조회수 카드는 skeleton 또는 `통계 API 연결 전` 상태를 보여준다.
- 총 게시글/댓글/카테고리는 기존 API로 fallback한다.

### 5.4 Traffic trend

차트는 신규 dependency 없이 시작한다.

권장:

- `svg` 또는 CSS grid bar chart
- 최근 30일 기본
- segmented control: `7일`, `30일`, `90일`

데이터:

```ts
type AdminDashboardTrafficPoint = {
  date: string; // YYYY-MM-DD, Asia/Seoul 기준
  views: number;
};
```

### 5.5 Content performance

위젯:

- 최근 7일 인기 글
- 최근 30일 인기 글
- 상승 중인 글
- 오래 업데이트 안 된 인기 글

`오래 업데이트 안 된 인기 글` 기준:

- 최근 30일 조회수가 일정 기준 이상
- `updatedAt` 또는 `createdAt`이 180일 이상 이전

백엔드가 `updatedAt`을 제공하지 않으면 `createdAt` 기준으로 1차 구현한다.

### 5.6 Action center

운영자가 해야 할 일을 모아 보여준다.

권장 항목:

- 답변 필요한 댓글
- 미분류 글
- 카테고리 없는 글
- 오래 방치된 인기 글
- 최근 댓글 중 삭제 검토가 필요한 글, 추후 신고 기능이 생길 경우

현재 댓글에 답변 상태가 없다면 1차 기준:

- 부모 댓글이고 작성자가 글 작성자가 아니며, 자식 댓글 중 관리자 댓글이 없는 댓글

백엔드가 이 기준을 계산해서 `actionItems.unansweredComments`로 내려준다.

### 5.7 Category health

표시 항목:

- 카테고리명
- 글 수
- 최근 30일 조회수
- 최근 발행일
- 하위 카테고리 수

목적:

- 비어 있는 카테고리 찾기
- 너무 많은 글이 몰린 카테고리 찾기
- 오랫동안 업데이트되지 않은 카테고리 찾기

## 6. 프론트 API 계약

백엔드가 나중에 구현할 관리자 대시보드 API를 프론트에서 먼저 타입으로 정의한다.

### 6.1 신규 파일

```text
src/api/dashboard.ts
src/components/admin/dashboard/AdminDashboardOverview.tsx
src/components/admin/dashboard/AdminDashboardTrafficChart.tsx
src/components/admin/dashboard/AdminDashboardActionCenter.tsx
src/components/admin/dashboard/AdminDashboardPostPerformance.tsx
src/components/admin/dashboard/AdminDashboardCategoryHealth.tsx
```

### 6.2 신규 타입

`src/types/index.ts`에 추가한다.

```ts
export type DashboardRange = '7d' | '30d' | '90d';

export interface DashboardMetric {
  value: number;
  previousValue?: number;
  changeRate?: number;
}

export interface DashboardOverview {
  todayViews: DashboardMetric;
  weekViews: DashboardMetric;
  monthViews: DashboardMetric;
  totalPosts: number;
  totalComments: number;
  totalCategories: number;
  lastPublishedAt?: string | null;
  generatedAt: string;
}

export interface DashboardTrafficPoint {
  date: string;
  views: number;
}

export interface DashboardPostStat {
  id: number;
  title: string;
  slug: string;
  categoryName: string;
  viewCount: number;
  rangeViewCount: number;
  commentCount?: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface DashboardCategoryStat {
  id: number;
  name: string;
  parentId?: number | null;
  postCount: number;
  viewCount: number;
  recentViewCount: number;
  lastPublishedAt?: string | null;
  childrenCount: number;
}

export interface DashboardActionItems {
  unansweredComments: number;
  uncategorizedPosts: number;
  stalePopularPosts: number;
}

export interface AdminDashboardResponse {
  overview: DashboardOverview;
  traffic: DashboardTrafficPoint[];
  topPosts: DashboardPostStat[];
  risingPosts: DashboardPostStat[];
  stalePopularPosts: DashboardPostStat[];
  recentPosts: Post[];
  recentComments: AdminComment[];
  categoryStats: DashboardCategoryStat[];
  actionItems: DashboardActionItems;
}
```

### 6.3 신규 API 래퍼

```ts
import { http } from './http';
import { AdminDashboardResponse, ApiResponse, DashboardRange } from '@/types';

export const getAdminDashboard = async (
  range: DashboardRange = '30d',
  timezone = 'Asia/Seoul',
) => {
  const response = await http.get<ApiResponse<AdminDashboardResponse>>('/api/admin/dashboard', {
    params: { range, timezone },
  });

  return response.data.data;
};
```

### 6.4 신규 관리자 엔드포인트

프론트에서 먼저 정의하고 백엔드가 이후 맞춘다.

```http
GET /api/admin/dashboard?range=30d&timezone=Asia/Seoul
Authorization: Bearer {accessToken}
```

응답:

```json
{
  "code": "SUCCESS",
  "message": "OK",
  "data": {
    "overview": {
      "todayViews": { "value": 311, "previousValue": 277, "changeRate": 12.27 },
      "weekViews": { "value": 1830, "previousValue": 1504, "changeRate": 21.68 },
      "monthViews": { "value": 7124, "previousValue": 6302, "changeRate": 13.04 },
      "totalPosts": 102,
      "totalComments": 18,
      "totalCategories": 14,
      "lastPublishedAt": "2026-01-02T12:04:00+09:00",
      "generatedAt": "2026-05-28T20:00:00+09:00"
    },
    "traffic": [
      { "date": "2026-05-22", "views": 210 },
      { "date": "2026-05-23", "views": 245 }
    ],
    "topPosts": [
      {
        "id": 1,
        "title": "RTR (Refresh Token Rotation)",
        "slug": "rtr-(refresh-token-rotation)",
        "categoryName": "Network",
        "viewCount": 126,
        "rangeViewCount": 44,
        "commentCount": 0,
        "createdAt": "2026-01-02T12:04:00+09:00",
        "updatedAt": null
      }
    ],
    "risingPosts": [],
    "stalePopularPosts": [],
    "recentPosts": [],
    "recentComments": [],
    "categoryStats": [],
    "actionItems": {
      "unansweredComments": 0,
      "uncategorizedPosts": 0,
      "stalePopularPosts": 0
    }
  }
}
```

### 6.5 백엔드 준비 전 fallback

프론트를 먼저 개발할 때는 다음 순서로 처리한다.

1. `getAdminDashboard()`를 호출한다.
2. 404, 403, 네트워크 오류가 발생하면 기존 API 기반 fallback을 사용한다.
3. fallback으로 채울 수 없는 통계는 `null` 또는 비활성 카드로 표시한다.

Fallback으로 사용 가능한 기존 API:

```http
GET /api/posts?page=0&size=5&sort=createdAt,desc
GET /api/posts?page=0&size=5&sort=viewCount,desc
GET /api/categories
GET /api/admin/comments?page=0&size=5
```

Fallback UI 문구:

- `통계 API 연결 전`
- `백엔드 집계가 준비되면 표시됩니다.`

프론트 구현 시 주의:

- fallback은 개발 편의용이며, 관리자 통계의 최종 데이터는 반드시 `/api/admin/dashboard`에서 받는다.
- 공개 홈에서는 이 fallback 통계도 사용하지 않는다.

## 7. 화면별 구현 계획

### 7.1 공통 UI 컴포넌트

새로 만들거나 정리할 컴포넌트:

```text
src/components/ui/Surface.tsx
src/components/ui/MetricCard.tsx
src/components/ui/SegmentedControl.tsx
src/components/ui/IconButton.tsx
src/components/ui/StatusBadge.tsx
src/components/ui/EmptyState.tsx
```

원칙:

- 기존 로컬 패턴을 먼저 따른다.
- 너무 범용적인 디자인 시스템으로 크게 만들지 않는다.
- 관리자 대시보드와 공개 화면에서 반복되는 surface, badge, segmented control 정도만 추출한다.

### 7.2 홈 화면 파일

대상:

```text
src/app/page.tsx
src/components/post/PostCard.tsx
src/components/post/PostListItem.tsx
src/components/layout/Sidebar.tsx
src/components/layout/TopHeader.tsx
```

작업:

- 홈 상단 intro band 추가
- 공지 strip 재정리
- 최신 글 대표 카드 1개 + compact list 구성
- 카테고리 shelf 추가
- 영어 UI를 한국어로 통일
- 공개 홈에서 운영 집계 제거
- 카드 border, shadow, radius를 Apple style token에 맞게 조정

### 7.3 글 상세 화면 파일

대상:

```text
src/app/posts/[slug]/page.tsx
src/components/post/PostDetailClient.tsx
src/components/post/MarkdownRenderer.tsx
src/components/post/TOC.tsx
```

작업:

- 본문 max-width를 760-820px로 제한
- TOC active 상태를 선명하게 표시
- `ON THIS PAGE`를 `목차`로 변경
- `views`를 `조회`로 변경
- 이미지 caption과 본문 이미지 간격 정리
- code block, blockquote, table을 Apple style surface에 맞게 조정

### 7.4 관리자 대시보드 파일

대상:

```text
src/app/admin/page.tsx
src/components/admin/AdminRouteShell.tsx
src/api/dashboard.ts
src/types/index.ts
```

작업:

- 기존 `/admin` 위젯을 새 dashboard layout으로 재구성
- KPI cards 추가
- traffic chart 추가
- action center 추가
- content performance 추가
- category health 추가
- `range` segmented control 추가
- `/api/admin/dashboard` 연결
- API 미구현 시 fallback 표시

### 7.5 관리자 shell

현재 `AdminRouteShell`은 상단 pill nav 형태다. 대시보드가 풍성해지면 다음처럼 조정한다.

- desktop: 상단 toolbar + compact nav
- mobile: horizontal scroll nav 유지
- active 상태를 `bg-gray-950 text-white`보다 Apple style selected pill로 변경
- 관리자 화면 전체 max-width를 1180-1280px로 확장

## 8. 단계별 개발 순서

### Phase 1: 디자인 토큰과 공개 UI 정리

1. `globals.css`에 color/token 기반 style 추가
2. 공통 `Surface`, `StatusBadge`, `SegmentedControl` 구현
3. 홈 영어 UI 한국어화
4. 홈 intro, notice, featured/latest 구조 구현
5. 글 상세 본문 폭과 TOC 스타일 개선

검증:

```bash
npm run lint
npm run build
```

가능하면 브라우저로 확인:

- `/`
- `/archive`
- `/category/잡담`
- `/posts/rtr-(refresh-token-rotation)`

### Phase 2: 관리자 대시보드 프론트 골격

1. `src/types/index.ts`에 dashboard 타입 추가
2. `src/api/dashboard.ts` 추가
3. `/admin`을 dashboard section 구조로 분리
4. fallback 데이터 연결
5. 통계 API 미구현 상태 UI 구현

검증:

```bash
npm run lint
npm run build
```

확인:

- 로그아웃 상태에서 `/admin`은 `/login?redirect=/admin`으로 이동
- 관리자 상태에서 `/admin` dashboard가 보임
- `/api/admin/dashboard`가 404여도 화면이 깨지지 않음

### Phase 3: 백엔드 통계 API 연결

1. 백엔드에서 `/api/admin/dashboard` 구현
2. 프론트 fallback 대신 실제 데이터 표시
3. range segmented control이 `7d`, `30d`, `90d`를 전환
4. top/rising/stale posts 데이터 표시

확인:

- 오늘 조회수, 최근 7일, 최근 30일이 관리자에게만 보임
- 공개 홈과 글 상세에는 일간/주간/월간 집계가 보이지 않음

### Phase 4: 다듬기

1. 다크 모드 대비
2. reduced motion 대응
3. skeleton UI 정리
4. 모바일 레이아웃 확인
5. 기존 lint baseline 정리

## 9. 접근성과 UX 기준

- icon-only button에는 `aria-label`을 반드시 둔다.
- segmented control은 현재 선택 값을 스크린리더가 알 수 있게 한다.
- 색상만으로 상태를 전달하지 않는다.
- hover만 있는 UI는 mobile에서 접근 불가능하므로 click/tap 상태를 제공한다.
- 관리자 삭제/로그아웃/권한 변경 같은 위험 행동은 기존 확인 패턴을 유지한다.
- 운영 통계는 관리자 권한 확인 후 렌더링한다.

## 10. 완료 기준

프론트 리뉴얼 1차 완료 기준:

- 홈 화면이 공개 통계 없이도 풍성하게 보인다.
- 글 상세 본문 폭과 TOC가 읽기 좋은 형태로 정리된다.
- 영어 UI가 한국어로 통일된다.
- `/admin`에 오늘/7일/30일 조회수 카드가 들어갈 자리가 생긴다.
- `/api/admin/dashboard` 미구현 상태에서도 관리자 대시보드가 깨지지 않는다.
- 백엔드 구현 후 같은 타입으로 바로 연결할 수 있다.
- `npm run build`가 통과한다.

