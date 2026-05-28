// 1. 공통 응답 구조
export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

// 🆕 인접 게시글 정보 (이전글/다음글)
export interface PostNeighbor {
  slug: string;
  title: string;
}

// 2. 게시글 (Post) 타입
export interface Post {
  id: number;
  title: string;
  slug: string;
  categoryName: string;
  viewCount: number;
  createdAt: string;
  updatedAt?: string | null;
  content?: string;
  tags: string[];
  // 🆕 백엔드 변경 사항 반영: 이전글/다음글 정보 추가
  prevPost?: PostNeighbor | null;
  nextPost?: PostNeighbor | null;
}

export interface PageMeta {
  totalPages: number;
  totalElements: number;
  number?: number;
  last?: boolean;
}

// 3. 게시글 목록 페이징 응답
export interface PostListResponse extends PageMeta {
  content: Post[];
  page?: PageMeta;
}

export interface PostSaveRequest {
  title: string;
  content: string;
  categoryId: number;
  tags: string[];
}

export interface ChessPuzzle {
  id: number;
  date: string;
  title: string;
  theme: string;
  fen: string;
  answer: string;
  answerUci: string;
  hint: string;
  rating: number;
  sourceUrl: string;
}

// 4. 로그인 응답
export interface AuthResponse {
  grantType: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
}

// 5. 카테고리
export interface Category {
  id: number;
  name: string;
  parentId?: number | null;
  children: Category[];
}

// 6. 프로필 정보
export interface Profile {
  name: string;
  bio: string;
  imageUrl?: string;
  githubUrl?: string;
  email?: string;
}

// 7. 회원가입 요청
export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
}

// 8. 이메일 인증 요청
export interface VerifyRequest {
  email: string;
  code: string;
}

// 9. 로그인 요청
export interface LoginRequest {
  email: string;
  password: string;
}

// 10. 로그인 성공 응답 데이터
export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
}

// 11. 프로필 수정 요청
export interface ProfileUpdateRequest {
  name: string;
  bio: string;
  imageUrl?: string;
  githubUrl?: string;
  email?: string;
}

// 12. 카테고리 생성 요청
export interface CategoryCreateRequest {
  name: string;
  parentId?: number | null;
}

// 13. 카테고리 수정 요청
export interface CategoryUpdateRequest {
  name: string;
  parentId?: number | null;
}

// 14. 댓글 타입 (계층형)
export interface Comment {
  id: number;
  content: string;
  author: string;
  isPostAuthor: boolean;
  memberId?: number | null;
  createdAt: string;
  children: Comment[];
}

// 15. 댓글 작성 요청
export interface CommentSaveRequest {
  postSlug: string;
  content: string;
  parentId?: number | null;
  guestNickname?: string; // 비회원일 경우 필수
  guestPassword?: string; // 비회원일 경우 필수
}

// 16. 댓글 삭제 요청 (비회원 검증용)
export interface CommentDeleteRequest {
  guestPassword?: string;
}

export interface AdminComment {
  id: number;
  content: string;
  author?: string;
  guestNickname?: string;
  memberNickname?: string;
  postSlug?: string;
  postTitle?: string;
  createdAt: string;
}

export interface AdminCommentListResponse extends PageMeta {
  content: AdminComment[];
  page?: PageMeta;
}

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
