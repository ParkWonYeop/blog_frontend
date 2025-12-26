// 1. 공통 응답 구조 (API 명세 0번 참고)
export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

// 2. 게시글 (Post) 타입 (API 명세 2번 참고)
export interface Post {
  id: number;
  title: string;
  slug: string;
  categoryName: string;
  viewCount: number;
  createdAt: string;
  content?: string; // 상세 조회시에만 옴
}

// 3. 게시글 목록 페이징 응답
export interface PostListResponse {
  content: Post[];
  totalPages: number;
  totalElements: number;
  last: boolean;
}

// 4. 로그인 응답 (API 명세 1-3번 참고)
export interface AuthResponse {
  grantType: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
}

// 5. 카테고리 (API 명세 4번 참고)
export interface Category {
  id: number;
  name: string;
  children: Category[];
}

// 1. 회원가입 요청
export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
}

// 2. 이메일 인증 요청
export interface VerifyRequest {
  email: string;
  code: string;
}

// 3. 로그인 요청
export interface LoginRequest {
  email: string;
  password: string;
}

// 4. 로그인 성공 응답 데이터
export interface LoginResponse {
  accessToken: string;
  refreshToken?: string; // 나중을 위해 추가
}