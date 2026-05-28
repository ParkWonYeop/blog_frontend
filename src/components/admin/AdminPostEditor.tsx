'use client';

import axios from 'axios';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Clock,
  FileText,
  Folder,
  Image as ImageIcon,
  Loader2,
  Save,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { getCategories } from '@/api/category';
import { uploadImage } from '@/api/image';
import { createPost, getPost, updatePost } from '@/api/posts';
import { useAuthStore } from '@/store/authStore';
import { ApiResponse, AuthResponse, Category, Post, PostSaveRequest } from '@/types';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false },
);

interface DraftPost {
  id: number;
  title: string;
  content: string;
  savedAt: string;
}

interface AdminPostEditorProps {
  editSlug?: string;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return `${fallback}: ${response.data.message}`;
  }

  if (error instanceof Error) return `${fallback}: ${error.message}`;

  return fallback;
};

const findCategoryByName = (categories: Category[], name: string): Category | null => {
  for (const category of categories) {
    if (category.name === name) return category;

    const found = findCategoryByName(category.children || [], name);
    if (found) return found;
  }

  return null;
};

const isTokenExpired = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((character) => `%${(`00${character.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join(''),
    );
    const { exp } = JSON.parse(jsonPayload) as { exp?: number };

    return !exp || Date.now() / 1000 >= exp - 30;
  } catch {
    return true;
  }
};

function CategoryOptions({
  categories,
  selectedId,
  onSelect,
  depth = 0,
}: {
  categories: Category[];
  selectedId: number | '';
  onSelect: (id: number) => void;
  depth?: number;
}) {
  return (
    <>
      {categories.map((category) => (
        <div key={category.id}>
          <label className="flex cursor-pointer items-center gap-2 rounded p-2 transition-colors hover:bg-gray-50">
            <input
              type="radio"
              name="category"
              value={category.id}
              checked={selectedId === category.id}
              onChange={(event) => onSelect(Number(event.target.value))}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span
              style={{ marginLeft: `${depth * 10}px` }}
              className={depth === 0 ? 'font-medium' : 'text-gray-600'}
            >
              {depth > 0 && '- '}
              {category.name}
            </span>
          </label>
          {category.children?.length > 0 && (
            <CategoryOptions
              categories={category.children}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          )}
        </div>
      ))}
    </>
  );
}

function DraftLoadDialog({
  draft,
  onCancel,
  onConfirm,
}: {
  draft: DraftPost;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/35 px-4 py-6 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="border-b border-gray-100 p-5">
          <h3 className="text-lg font-bold text-gray-950">임시저장 불러오기</h3>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            현재 작성 중인 내용이 선택한 임시저장 글로 바뀝니다.
          </p>
        </div>

        <div className="p-5">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="line-clamp-2 text-sm font-semibold text-gray-950">{draft.title}</p>
            <p className="mt-1 text-xs text-gray-500">{draft.savedAt}</p>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              불러오기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPostEditor({ editSlug }: AdminPostEditorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { isLoggedIn, role, _hasHydrated, accessToken, refreshToken, login } = useAuthStore();
  const isAdmin = _hasHydrated && role?.includes('ADMIN');
  const isEditMode = Boolean(editSlug);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('**Hello world!**');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [tags, setTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drafts, setDrafts] = useState<DraftPost[]>([]);
  const [showDraftList, setShowDraftList] = useState(false);
  const [draftToLoad, setDraftToLoad] = useState<DraftPost | null>(null);

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isLoggedIn) {
      toast.error('로그인이 필요합니다.');
      const currentPath = typeof window === 'undefined' ? pathname : `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?redirect=${encodeURIComponent(currentPath || '/admin/posts/new')}`);
      return;
    }

    if (!isAdmin) {
      toast.error('관리자 권한이 필요합니다.');
      router.replace('/');
    }
  }, [_hasHydrated, isAdmin, isLoggedIn, pathname, router]);

  useEffect(() => {
    const savedDrafts = localStorage.getItem('temp_drafts');
    if (!savedDrafts) return;

    try {
      setDrafts(JSON.parse(savedDrafts) as DraftPost[]);
    } catch {
      localStorage.removeItem('temp_drafts');
    }
  }, []);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    enabled: isAdmin,
  });

  const { data: existingPost, isLoading: isLoadingPost } = useQuery({
    queryKey: ['post', editSlug],
    queryFn: () => getPost(editSlug!),
    enabled: isAdmin && isEditMode,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (!existingPost) return;

    setTitle(existingPost.title || '');
    setContent(existingPost.content || '');
    setTags(existingPost.tags ? existingPost.tags.join(', ') : '');

    if (categories.length > 0 && existingPost.categoryName) {
      const found = findCategoryByName(categories, existingPost.categoryName);
      if (found) setCategoryId(found.id);
    }
  }, [existingPost, categories]);

  const saveDrafts = (nextDrafts: DraftPost[]) => {
    setDrafts(nextDrafts);
    localStorage.setItem('temp_drafts', JSON.stringify(nextDrafts));
  };

  const handleTempSave = () => {
    if (!title.trim() && !content.trim()) {
      toast.error('제목이나 내용을 입력해주세요.');
      return;
    }

    if (drafts.length >= 10) {
      toast.error('임시저장은 최대 10개까지만 가능합니다.\n기존 저장분을 삭제해주세요.');
      setShowDraftList(true);
      return;
    }

    saveDrafts([
      {
        id: Date.now(),
        title: title || '(제목 없음)',
        content,
        savedAt: new Date().toLocaleString(),
      },
      ...drafts,
    ]);
    toast.success('임시저장 되었습니다.');
  };

  const handleLoadDraft = (draft: DraftPost) => {
    setDraftToLoad(draft);
  };

  const confirmLoadDraft = () => {
    if (!draftToLoad) return;

    setTitle(draftToLoad.title === '(제목 없음)' ? '' : draftToLoad.title);
    setContent(draftToLoad.content);
    setShowDraftList(false);
    setDraftToLoad(null);
    toast.success('불러오기 완료');
  };

  const handleDeleteDraft = (id: number) => {
    saveDrafts(drafts.filter((draft) => draft.id !== id));
    toast.success('삭제되었습니다.');
  };

  const mutation = useMutation({
    mutationFn: (data: PostSaveRequest) => {
      if (isEditMode) {
        return updatePost(existingPost!.id, data);
      }

      return createPost(data);
    },
    onSuccess: async (response: ApiResponse<Post>) => {
      const savedPost = response.data;
      const newSlug = savedPost?.slug || editSlug;

      await queryClient.resetQueries({ queryKey: ['posts'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });

      if (editSlug) {
        queryClient.removeQueries({ queryKey: ['post', editSlug] });
      }
      if (newSlug && newSlug !== editSlug) {
        queryClient.removeQueries({ queryKey: ['post', newSlug] });
      }

      toast.success(isEditMode ? '게시글이 수정되었습니다.' : '게시글이 발행되었습니다.');
      router.push(newSlug ? `/posts/${newSlug}` : '/admin');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '저장 실패'));
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const ensureAuthToken = async (): Promise<boolean> => {
    if (!accessToken || !refreshToken) {
      toast.error('로그인이 필요합니다.');
      return false;
    }

    if (!isTokenExpired(accessToken)) return true;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const { data } = await axios.post<ApiResponse<AuthResponse>>(
        `${baseUrl}/api/auth/reissue`,
        { accessToken, refreshToken },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true },
      );

      if (data.code === 'SUCCESS' && data.data) {
        login(data.data.accessToken, data.data.refreshToken);
        return true;
      }

      return false;
    } catch {
      toast.error('세션이 만료되었습니다.\n작성 중인 글을 복사해두고 다시 로그인해주세요.', { duration: 5000 });
      return false;
    }
  };

  const appendImageMarkdown = (imageUrl: string) => {
    setContent((previous) => `${previous}\n![image](${imageUrl})`);
  };

  const uploadEditorImage = async (file: File, successMessage: string, toastId: string) => {
    const isTokenValid = await ensureAuthToken();
    if (!isTokenValid) return;

    const response = await uploadImage(file);
    if (response.code === 'SUCCESS' && response.data) {
      appendImageMarkdown(response.data);
      toast.success(successMessage, { id: toastId });
    } else {
      toast.error(response.message || '이미지 업로드 실패', { id: toastId });
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('제목과 내용을 입력해주세요.');
      return;
    }
    if (categoryId === '') {
      toast.error('카테고리를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);

    const isTokenValid = await ensureAuthToken();
    if (!isTokenValid) {
      setIsSubmitting(false);
      return;
    }

    mutation.mutate({
      title,
      content,
      categoryId: Number(categoryId),
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const uploadToast = toast.loading('이미지 업로드 중...');

    try {
      await uploadEditorImage(file, '이미지가 업로드되었습니다.', uploadToast);
    } catch (error) {
      toast.error(getErrorMessage(error, '이미지 업로드 실패'), { id: uploadToast });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handlePaste = async (event: React.ClipboardEvent<HTMLDivElement>) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (!item.type.startsWith('image')) continue;

      event.preventDefault();
      const file = item.getAsFile();
      if (!file) return;

      setIsUploading(true);
      const uploadToast = toast.loading('이미지 업로드 중...');

      try {
        await uploadEditorImage(file, '이미지 붙여넣기 완료.', uploadToast);
      } catch (error) {
        toast.error(getErrorMessage(error, '이미지 업로드 실패'), { id: uploadToast });
      } finally {
        setIsUploading(false);
      }
    }
  };

  if (!_hasHydrated || !isAdmin || (isEditMode && isLoadingPost)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8" onPaste={handlePaste}>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/posts')}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100"
            aria-label="게시글 관리로 돌아가기"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? '게시글 수정' : '새 글 작성'}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <div className="flex items-center rounded-lg border border-gray-300 bg-white shadow-sm">
              <button
                type="button"
                onClick={handleTempSave}
                className="flex items-center gap-2 rounded-l-lg border-r border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                title="현재 내용 임시저장"
              >
                <FileText size={16} className="text-gray-500" />
                <span className="hidden sm:inline">임시저장</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDraftList(!showDraftList)}
                className="flex items-center gap-1 rounded-r-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                title="임시저장 목록 보기"
              >
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-bold text-gray-600">
                  {drafts.length}
                </span>
              </button>
            </div>

            {showDraftList && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDraftList(false)} />
                <div className="absolute right-0 top-full z-20 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
                    <h3 className="text-sm font-bold text-gray-700">임시저장 목록 ({drafts.length}/10)</h3>
                    <button type="button" onClick={() => setShowDraftList(false)} aria-label="임시저장 목록 닫기">
                      <X size={16} className="text-gray-400 hover:text-gray-600" />
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {drafts.length === 0 ? (
                      <div className="p-8 text-center text-sm text-gray-400">저장된 글이 없습니다.</div>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {drafts.map((draft) => (
                          <li key={draft.id} className="group p-3 transition-colors hover:bg-blue-50">
                            <div className="flex items-start justify-between gap-2">
                              <button type="button" onClick={() => handleLoadDraft(draft)} className="flex-1 text-left">
                                <p className="mb-1 line-clamp-1 text-sm font-medium text-gray-800 group-hover:text-blue-600">
                                  {draft.title}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                  <Clock size={12} />
                                  {draft.savedAt}
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDraft(draft.id)}
                                className="rounded p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                                title="삭제"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-bold text-white shadow-md transition-colors duration-200 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {isEditMode ? '수정하기' : '작성하기'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-3">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full border-none bg-transparent py-2 text-3xl font-bold outline-none placeholder:text-gray-300"
          />
          <div data-color-mode="light">
            <MDEditor
              value={content}
              onChange={(value) => setContent(value || '')}
              height={600}
              preview="edit"
              className="rounded-lg border border-gray-200 shadow-sm !font-sans"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="sticky top-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-gray-700">
              <Folder size={18} />
              카테고리
            </h3>
            <div className="max-h-60 space-y-1 overflow-y-auto border-t border-gray-100 pt-2 text-sm">
              {categories.length > 0 ? (
                <CategoryOptions categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
              ) : (
                <p className="text-sm text-gray-400">로딩 중...</p>
              )}
            </div>
          </div>

          <div className="sticky top-[280px] rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-gray-700">
              <ImageIcon size={18} />
              이미지 업로드
            </h3>
            <p className="mb-3 text-xs leading-relaxed text-gray-500">
              에디터에 이미지를 <br />
              <strong>복사 & 붙여넣기(Ctrl+V)</strong> 하거나
              <br /> 아래 버튼을 사용하세요.
            </p>

            <label
              className={`flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition-all duration-200 hover:border-blue-400 hover:bg-gray-50 ${isUploading ? 'cursor-wait opacity-50' : ''}`}
            >
              <div className="flex flex-col items-center justify-center pb-6 pt-5">
                <UploadCloud className="mb-2 h-8 w-8 text-gray-400" />
                <p className="text-xs font-medium text-gray-500">
                  {isUploading ? '업로드 중...' : '클릭하여 이미지 선택'}
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>
          </div>
        </div>
      </div>

      {draftToLoad && (
        <DraftLoadDialog
          draft={draftToLoad}
          onCancel={() => setDraftToLoad(null)}
          onConfirm={confirmLoadDraft}
        />
      )}
    </div>
  );
}
