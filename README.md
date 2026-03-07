# WYPark Blog Frontend

개발 기록과 기술 콘텐츠를 운영하기 위한 WYPark Blog의 프론트엔드입니다.

공개 블로그, Markdown 리더, 계층형 댓글, 오늘의 체스 퍼즐, Maia 봇 대국과 관리자용 콘텐츠 운영 도구를 하나의 Next.js 애플리케이션으로 제공합니다. 데스크톱에서는 macOS 스타일의 메뉴 바·사이드바·Dock을 사용하고, 모바일에서는 같은 기능을 작은 화면에 맞게 재구성합니다.

- 서비스: [https://blog.wypark.me](https://blog.wypark.me)
- 프로덕션 API: `https://blogserver.wypark.me`
- 기본 로컬 API: `http://localhost:8080`

## 주요 기능

### 공개 블로그

- 최신 글, 인기 글, 공지 목록
- 제목·본문 검색
- 카테고리별 카드/리스트 보기와 페이지 크기 설정
- 연도·월·카테고리별 아카이브 탐색
- 이전 글·다음 글 이동 및 목차가 포함된 게시글 리더
- SEO metadata, canonical URL, `robots.txt`, 동적 sitemap

### 콘텐츠와 상호작용

- GitHub Flavored Markdown
- 코드 문법 강조와 복사 기능
- KaTeX 수식, 표, 이미지, 외부 링크
- 회원·비회원 댓글과 계층형 답글
- 날짜별 체스 퍼즐과 정답 진행 상태
- 로그인 사용자용 Maia 체스 봇 대국, 기권·무르기, PGN과 대국 기록

### 관리자 도구

- 운영 지표와 최근 활동 대시보드
- 게시글 검색·정렬·수정·단건/대량 삭제
- Markdown 작성기, 이미지 업로드, 태그와 카테고리 지정
- 브라우저 임시저장 최대 10건
- 계층형 카테고리 생성·이동·수정·삭제
- 댓글 관리와 공개 프로필 편집
- 관리자 route guard와 로그인 redirect 복원

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| Framework | Next.js 16 App Router, React 19 |
| Language | TypeScript 5, strict mode |
| Styling | Tailwind CSS 4, CSS custom properties |
| Server state | TanStack React Query 5 |
| Client state | Zustand 5 |
| HTTP | Axios |
| Forms | React Hook Form |
| Markdown | React Markdown, remark/rehype, KaTeX, React Syntax Highlighter |
| Editor | `@uiw/react-md-editor` |
| Icons | Lucide React |
| Runtime | Node.js 20 |

## 빠른 시작

### 사전 요구사항

- Node.js 20
- npm
- 게시글·댓글·인증 기능을 확인하려면 실행 가능한 백엔드 API

### 설치 및 실행

```bash
npm ci
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

기본적으로 `http://localhost:8080`을 API 서버로 사용합니다. 다른 서버를 사용하려면 프로젝트 루트에 `.env.local`을 만듭니다.

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8080
```

예를 들어 프로덕션 데이터를 사용한 UI 검증은 다음과 같이 실행할 수 있습니다.

```bash
NEXT_PUBLIC_API_URL=https://blogserver.wypark.me npm run dev
```

> `NEXT_PUBLIC_` 변수는 브라우저 번들에 포함됩니다. 비밀키나 토큰을 넣지 마세요.

## 명령어

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run typecheck` | TypeScript 검사 |
| `npm run check` | lint와 typecheck 순차 실행 |
| `npm run build` | Webpack 기반 프로덕션 빌드 |
| `npm run start` | 프로덕션 빌드 실행 |

일반적인 변경은 `npm run check`, 라우팅·인증·데이터 패칭·Markdown·배포 관련 변경은 `npm run build`까지 통과해야 합니다.

## 프로젝트 구조

```text
src/
├── api/                         # 백엔드 API와 인증 HTTP 경계
│   ├── http.ts                  # 공통 Axios 인스턴스와 재시도 인터셉터
│   ├── authSession.ts           # 탭 내/탭 간 토큰 재발급 조정
│   ├── authRefresh.ts           # 인터셉터를 우회하는 순수 재발급 요청
│   └── publicPosts.ts           # 서버 렌더링용 공개 게시글 fetch
├── app/                         # App Router route, layout, metadata
│   ├── admin/                   # 관리자 route
│   ├── chess/                   # Maia 대국 로비·플레이·기록
│   ├── category/[id]/           # 카테고리별 게시글
│   ├── posts/[slug]/            # 게시글 상세
│   └── play/chess/              # 오늘의 체스 퍼즐
├── components/
│   ├── admin/                   # 관리자 패널과 편집기
│   ├── chess/                   # 공용 보드·퍼즐·Maia 대국 UI
│   ├── comment/                 # 댓글 폼·목록·항목
│   ├── layout/                  # Sidebar, menu bar, Dock, shell
│   ├── post/                    # 카드·목록·Markdown·TOC
│   ├── theme/                   # light/dark/system 테마
│   └── ui/                      # 공통 surface와 상태 UI
├── config/                      # 환경 설정
├── lib/                         # 순수 도메인 유틸리티와 query key
├── store/                       # Zustand 인증 상태
└── types/                       # 도메인별 API/화면 타입과 barrel export
```

그 밖의 주요 파일은 다음과 같습니다.

- `src/proxy.ts`: HTTP→HTTPS redirect와 HSTS 처리
- `src/app/globals.css`: 테마와 레이어 디자인 토큰
- `DESIGN.md`: UI 시스템과 반응형 원칙
- `AGENTS.md`: 자동화 도구와 기여자를 위한 저장소 작업 규칙
- `LOG.md`: 작업 내역, 검증 결과, 권장 후속 작업
- `DockerFile`: Node 20 기반 standalone 이미지
- `.gitea/workflows/deploy.yml`: Gitea 배포 파이프라인

## 아키텍처 원칙

### 데이터 요청

클라이언트 컴포넌트는 엔드포인트를 직접 호출하지 않고 `src/api`의 함수를 사용합니다. 인증 요청은 `http.ts`의 공통 Axios 인스턴스를 통과하므로 access token 주입과 재발급 후 재시도가 일관되게 적용됩니다.

공개 홈·아카이브·게시글 상세처럼 초기 HTML과 SEO가 중요한 화면은 `publicPosts.ts`의 서버용 `fetch` 함수를 사용합니다. React Query 키는 `src/lib/queryKeys.ts`에서만 생성합니다.

### 인증

인증 상태는 `auth-storage` 키로 유지되는 Zustand store가 관리합니다. 만료된 토큰은 다음 순서로 갱신합니다.

1. 같은 탭의 동시 요청은 하나의 refresh promise를 공유합니다.
2. Web Locks 지원 브라우저에서는 여러 탭의 refresh를 직렬화합니다.
3. lock을 얻은 뒤 저장소를 다시 읽어 다른 탭이 이미 갱신했는지 확인합니다.
4. 재발급 실패 시 인증 상태를 제거합니다.

재발급 요청은 응답 인터셉터의 재귀 호출을 막기 위해 공통 Axios 인스턴스를 사용하지 않습니다.

### UI와 테마

`DesktopShell`이 애플리케이션의 유일한 `main` landmark를 소유합니다. 페이지 컴포넌트는 내부 콘텐츠 구조만 렌더링합니다. 색상·border·shadow·blur는 `globals.css`의 CSS custom property를 사용하며, 새 화면은 `WindowSurface`, `Surface`, `EmptyState`, `StatusBadge` 같은 공통 컴포넌트를 우선 조합합니다.

### Markdown 보안

게시글 본문은 `MarkdownRenderer`를 통해 렌더링하며 `rehype-sanitize`를 유지합니다. Markdown 기능을 변경할 때는 XSS, 외부 링크, 이미지, 긴 URL, 코드 블록, 표, SSR 호환성을 함께 확인해야 합니다.

## 배포

`main` 브랜치 push 시 Gitea workflow가 다음 작업을 수행합니다.

1. `NEXT_PUBLIC_API_URL=https://blogserver.wypark.me`로 Docker 이미지 빌드
2. 기존 `blog-frontend` 컨테이너 교체
3. 호스트 `3005` 포트를 컨테이너 `3000` 포트에 연결
4. `unless-stopped` restart policy 적용

Next.js는 `output: 'standalone'`으로 빌드됩니다. Docker, Gitea workflow, `next.config.ts`의 배포 전제는 함께 변경해야 합니다.

## 작업 시 주의사항

- npm이 기준 패키지 매니저입니다. 의존성 변경 시 `package-lock.json`만 갱신합니다.
- API 주소, 공개 도메인, analytics ID, auth storage key, endpoint path를 별도 논의 없이 변경하지 않습니다.
- 백엔드가 없을 때 임의 mock 동작을 제품 코드에 추가하지 않습니다.
- 모든 작업은 [LOG.md](./LOG.md)에 검증 결과와 권장 후속 작업을 기록합니다.

자세한 저장소 작업 규칙은 [AGENTS.md](./AGENTS.md), UI 원칙은 [DESIGN.md](./DESIGN.md)를 참고하세요.
