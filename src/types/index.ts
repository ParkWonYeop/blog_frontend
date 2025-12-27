// 1. 공통 응답 구조
export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

// 2. 게시글 (Post) 타입
export interface Post {
  id: number;
  title: string;
  slug: string;
  categoryName: string;
  viewCount: number;
  createdAt: string;
  content?: string;
}

// 3. 게시글 목록 페이징 응답
export interface PostListResponse {
  content: Post[];
  totalPages: number;
  totalElements: number;
  last: boolean;
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