# WYPark Blog UI System

읽기 중심의 흑백 UI. 수치는 토스 TDS와 당근 SEED를 따른다.

토큰 원천: `src/app/globals.css`

## 색

원시 회색 램프 `--grey-00` ~ `--grey-1000`은 SEED gray 램프의 채도를 0으로 뺀 값이다. 다크 모드는 램프를 뒤집는다(바닥 `#000`). 라이트 `--grey-700`은 흰 바탕 AA 대비(4.5:1)를 맞추려고 `#737373`으로 보정했다.

컴포넌트는 아래 의미 토큰만 쓴다.

| 역할 | 토큰 |
| --- | --- |
| 글자 | `--color-text` / `-muted` / `-subtle` / `-placeholder` / `-disabled` |
| 바탕 | `--color-page`, `--color-surface`, `--color-surface-strong`, `--color-control`, `--color-raised` |
| 눌림·호버 | `--color-hover`, `--color-pressed` |
| 반전 | `--color-inverse`, `--color-on-inverse`, `--color-on-inverse-muted` |
| 선 | `--stroke-subtle`(반복되는 행 사이), `--stroke-muted`(섹션 경계, `--color-line`), `--stroke-weak`(카드·입력 외곽) |
| 주요 액션 | `--color-accent`(먹색), `--color-accent-hover`, `--color-on-accent` |
| 기능색 | `--color-danger`, `--color-danger-soft` |

- 빨강은 오류, 삭제, 체스 체크에만 쓴다. 성공·경고·정보 상태는 면의 농도로 나눈다(`StatusBadge`).
- 그림자는 바텀시트, 다이얼로그, 토스트에만 쓴다(`--shadow-floating`).
- 흑백 체스판(`#eeeeee` / `#b8b8b8`)과 기물 색은 테마와 무관한 고정값이다.

## 타이포그래피

Pretendard 하나만 쓴다. 숫자는 `tabular-nums`로 맞추고 모노스페이스는 코드에만 쓴다.

| 클래스 | 크기 / 줄높이 | 출처 |
| --- | --- | --- |
| `text-display` | 40 / 52 | SEED t13 |
| `text-title1` | 30 / 40 | TDS t1 |
| `text-title2` | 26 / 35 | TDS t2 |
| `text-title3` | 22 / 31 | TDS t3 |
| `text-title4` | 20 / 29 | TDS t4 |
| `text-body1` | 17 / 26 | TDS t5 |
| `text-body2` | 15 / 23 | TDS t6 |
| `text-caption1` | 13 / 20 | TDS t7 |
| `text-caption2` | 12 / 18 | TDS sub |

글 본문은 `.article-body`(17px, 줄높이 1.85)에서 한 번에 정의한다. 코드 블록은 색 없는 Prism 테마를 쓴다.

## 반경과 높이

| 클래스 | 값 | 주 용도 |
| --- | --- | --- |
| `rounded-md` | 8 | 32px 컨트롤, 인라인 코드 |
| `rounded-lg` | 10 | 36~40px 버튼, 목록 행 |
| `rounded-xl` | 14 | 44~48px 입력, 세그먼트 트랙 |
| `rounded-2xl` | 16 | 56px CTA, 코드 블록, 표 |
| `rounded-3xl` | 20 | 카드, 패널 |
| `rounded-4xl` | 24 | 홈 최신 글 블록, 바텀시트 |
| `rounded-full` | - | 칩, 아바타 |

## 모션

- 기본 전환은 150ms, `ease-standard`(0.35, 0, 0.35, 1).
- 시트와 드로어는 `ease-enter` / `ease-exit`, 200~250ms.
- 입장 애니메이션, hover lift, 스케일 효과는 쓰지 않는다. `prefers-reduced-motion`이면 전환을 끈다.

## 레이아웃

- `AppShell`: 유일한 `main`. 상단 56px `AppBar`, 데스크톱 264px `Sidebar`, 모바일 하단 `TabBar`.
- 콘텐츠 최대 폭: 1040px
- 글 본문 최대 폭: 720px
- 좌우 여백: 모바일 16px / 데스크톱 32px
- 사이드바는 접으면 완전히 숨는다(`sidebar-collapsed`). 모바일에서는 '탐색' 탭이 드로어로 연다.
- 모바일 '더보기'는 바텀시트다. 테마와 인증 이동이 여기에 있다.

## 컴포넌트

- `WindowSurface`: 도구 화면 패널. 흰 바탕, `--color-line` 외곽선, 선택적 헤더.
- `Surface`: 패널 안 묶음. 회색 면, 테두리 없음.
- `PostListItem`: 목록 행(`<li>`). 부모는 `<ul>`로 감싼다.
- `SegmentedControl`, `ThemeToggle`: 회색 트랙 위 raised 칩.
- `StatusBadge`: 6px 반경의 각진 배지.
- 칩: 높이 36px, `rounded-full`, 선택 시 반전.

한 화면의 채운 먹색 버튼은 하나다. 나머지 액션은 회색 면 버튼이나 텍스트 버튼으로 둔다.

## 문구

- 해요체, 능동형, 긍정형으로 쓴다. 제목, 버튼, 라벨에는 마침표를 찍지 않는다.
- 버튼 이름은 누르면 일어날 일이다(`인증 코드 받기`, `확인`, `닫기`).
- 화면 동작이나 내부 처리를 문장으로 설명하지 않는다.
- "A는 ~고, B는 ~다" 같은 대구 문형을 쓰지 않는다. 숫자 정보는 문장 대신 라벨과 값으로 보여 준다.

## 쓰지 않는 것

조사한 AI 생성 UI의 공통 특징이라 피한다.

- 그라데이션 배경, 글래스모피즘, 네온 포인트색, glow
- 아이콘을 넣은 네모 타일을 모든 항목 앞에 붙이기
- 둥근 카드 한쪽에 굵은 컬러 바(`border-l-4`)
- 근거 없는 pill 배지, 깜빡이는 상태 점
- 카드 안의 카드, 모든 항목을 같은 반경의 카드로 쪼개기
- 섹션마다 fade·slide 입장, 모든 카드의 hover lift
- 대문자 자간 eyebrow 라벨, 메타 정보의 모노스페이스
- 링크 끝 `→`, 이모지 아이콘, 순서가 아닌 `01 / 02` 번호
- macOS 창 장식(트래픽 라이트, Dock, 가짜 상태 아이콘)

## 접근성

- 아이콘 전용 버튼에는 접근 가능한 이름을 단다.
- 토글은 `aria-pressed`, 현재 위치는 `aria-current`를 쓴다.
- 포커스는 2px 먹색 outline으로 보인다. hover로만 드러나는 기능은 두지 않는다.
- 작은 화면에서 가로 스크롤이 생기지 않게 `min-w-0`과 줄바꿈을 명시한다.
- 파괴적 관리자 작업은 확인 후 실행하고 `--color-danger`로 구분한다.
