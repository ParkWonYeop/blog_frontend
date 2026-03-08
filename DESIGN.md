# WYPark Blog UI System

## 방향

WYPark Blog는 읽기 중심의 블로그 위에 차분한 macOS 데스크톱 메타포를 적용합니다. 장식보다 콘텐츠 위계를 우선하며, 모든 화면은 같은 window, surface, control 토큰을 공유합니다.

## 레이아웃 책임

- Desktop menu bar: 현재 앱과 최소한의 시스템 상태를 표시합니다.
- Sidebar: 프로필, 검색, 카테고리 탐색을 담당합니다.
- Dock: 홈, 아카이브, 체스, 인증 및 관리자 이동을 담당합니다.
- Content window: 페이지별 실제 콘텐츠를 담습니다.

같은 이동 링크를 여러 영역에 중복 배치하지 않습니다. 모바일에서는 Dock이 주요 이동 수단이며 Sidebar는 필요할 때 여는 탐색 패널로 동작합니다.

## 시각 토큰

색상과 레이어 값은 `src/app/globals.css`의 CSS custom property를 단일 원천으로 사용합니다.

- `--color-page`, `--color-text*`: 페이지와 텍스트 계층
- `--window-*`: 최상위 콘텐츠 창
- `--card-*`: 창 내부 surface
- `--control-*`: 입력과 버튼
- `--sidebar-*`, `--menubar-*`, `--dock-*`: 영구 shell 영역
- `--shadow-*`: 레이어별 그림자

컴포넌트에서 고정 색을 추가하기보다 이 토큰을 우선 사용합니다. light/dark 테마는 같은 의미의 토큰 값을 교체하며 컴포넌트 구조를 바꾸지 않습니다.

## 공통 컴포넌트

- `WindowSurface`: 페이지 또는 도구 창
- `Surface`: 창 내부 카드와 섹션
- `EmptyState`: 빈 목록과 연결 전 상태
- `StatusBadge`: 상태 및 분류 표시
- `SegmentedControl`: 소수 선택지 전환
- `MetricCard`: 관리자 지표

새 화면은 위 primitives를 조합하고, 반복되는 border/background/shadow class 묶음을 새로 복제하지 않습니다.

## 반응형 및 접근성

- 작은 화면에서 가로 스크롤이 생기지 않도록 `min-w-0`와 줄바꿈을 명시합니다.
- 아이콘 전용 버튼에는 접근 가능한 이름을 제공합니다.
- 토글은 `aria-pressed`, 현재 페이지 링크는 `aria-current`를 사용합니다.
- hover만으로 기능을 숨기지 않고 키보드 focus 상태를 함께 지원합니다.
- 파괴적 관리자 작업은 사용자가 확인한 뒤 실행합니다.

## 콘텐츠 표면

게시글 본문은 `MarkdownRenderer`를 통해서만 렌더링합니다. sanitize 단계를 유지하고, 코드·표·이미지·긴 URL이 모바일 폭을 넘지 않도록 합니다. 공개 목록과 reader는 관리자 도구보다 시각적 밀도를 낮게 유지합니다.
