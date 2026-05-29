'use client';

import axios from 'axios';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Folder,
  Image as ImageIcon,
  Loader2,
  Save,
  Tags,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { getCategories } from '@/api/category';
import { uploadImage } from '@/api/image';
import { createPost, getPost, updatePost } from '@/api/posts';
import Surface from '@/components/ui/Surface';
import WindowSurface from '@/components/ui/WindowSurface';
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

const findCategoryById = (categories: Category[], id: number): Category | null => {
  for (const category of categories) {
    if (category.id === id) return category;

    const found = findCategoryById(category.children || [], id);
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
    <div className={depth === 0 ? 'space-y-1' : 'mt-1 space-y-1'}>
      {categories.map((category) => (
        <div key={category.id}>
          <label
            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-text-muted)] transition hover:bg-black/[0.04] hover:text-[var(--color-text)] dark:hover:bg-white/10"
            style={{ marginLeft: `${depth * 10}px` }}
          >
            <input
              type="radio"
              name="category"
              value={category.id}
              checked={selectedId === category.id}
              onChange={(event) => onSelect(Number(event.target.value))}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            <span className={depth === 0 ? 'font-semibold' : ''}>{category.name}</span>
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
    </div>
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 px-4 py-6 backdrop-blur-sm sm:items-center">
      <WindowSurface
        title="임시저장 불러오기"
        className="w-full max-w-md"
        bodyClassName="p-5"
      >
        <p className="text-sm leading-6 text-[var(--color-text-muted)]">
          현재 작성 중인 내용이 선택한 임시저장 글로 바뀝니다.
        </p>

        <Surface strong className="mt-4 p-4 shadow-none">
          <p className="line-clamp-2 text-sm font-semibold text-[var(--color-text)]">{draft.title}</p>
          <p className="mt-1 text-xs text-[var(--color-text-subtle)]">{draft.savedAt}</p>
        </Surface>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-control)] px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)] transition hover:bg-[var(--window-bg-strong)] hover:text-[var(--color-text)]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)]"
          >
            불러오기
          </button>
        </div>
      </WindowSurface>
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
  const [content, setContent] = useState('');
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

  const selectedCategoryName = useMemo(() => {
    if (categoryId === '') return '선택 안 됨';

    return findCategoryById(categories, categoryId)?.name || '선택 안 됨';
  }, [categories, categoryId]);

  const contentLength = content.trim().length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 350));
  const canSubmit = Boolean(title.trim() && content.trim() && categoryId !== '');

  const saveDrafts = (nextDrafts: DraftPost[]) => {
    setDrafts(nextDrafts);
    localStorage.setItem('temp_drafts', JSON.stringify(nextDrafts));
  };

  const handleTempSave = () => {
    if (!title.trim() && !content.trim()) {
      toast.error('제목이나 내용을 입력해 주세요.');
      return;
    }

    if (drafts.length >= 10) {
      toast.error('임시저장은 최대 10개까지 가능합니다. 기존 저장분을 삭제해 주세요.');
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
    toast.success('임시저장했습니다.');
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
    toast.success('임시저장을 불러왔습니다.');
  };

  const handleDeleteDraft = (id: number) => {
    saveDrafts(drafts.filter((draft) => draft.id !== id));
    toast.success('삭제했습니다.');
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

      toast.success(isEditMode ? '게시글을 수정했습니다.' : '게시글을 발행했습니다.');
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
      toast.error('세션이 만료되었습니다. 작성 중인 글을 복사해 두고 다시 로그인해 주세요.', { duration: 5000 });
      return false;
    }
  };

  const appendImageMarkdown = (imageUrl: string) => {
    setContent((previous) => `${previous}${previous ? '\n\n' : ''}![image](${imageUrl})`);
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
      toast.error('제목과 내용을 입력해 주세요.');
      return;
    }
    if (categoryId === '') {
      toast.error('카테고리를 선택해 주세요.');
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
      await uploadEditorImage(file, '이미지를 추가했습니다.', uploadToast);
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
        await uploadEditorImage(file, '붙여넣은 이미지를 추가했습니다.', uploadToast);
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
        <Loader2 className="animate-spin text-[var(--color-accent)]" size={40} />
      </div>
    );
  }

  return (
    <main className="mx-auto w-full px-0 py-4 md:w-[80vw] md:max-w-[1400px] md:py-6" onPaste={handlePaste}>
      <WindowSurface
        title={isEditMode ? '글 수정' : '새 글 작성'}
        subtitle="Markdown Studio"
        controls={(
          <button
            type="button"
            onClick={() => router.push('/admin/posts')}
            className="inline-flex h-8 items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-control)] px-3 text-xs font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition hover:bg-[var(--window-bg-strong)] hover:text-[var(--color-text)]"
          >
            <ArrowLeft size={14} />
            목록
          </button>
        )}
        bodyClassName="p-4 md:p-6"
      >
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="min-w-0 space-y-4">
            <Surface strong className="p-4 shadow-none md:p-5">
              <div className="mb-4 flex flex-col gap-3 border-b border-[var(--color-line)] pb-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-subtle)]">Document</p>
                  <h1 className="mt-1 text-xl font-bold text-[var(--color-text)]">
                    {isEditMode ? '게시글 수정' : '게시글 작성'}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTempSave}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-control)] px-4 text-sm font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition hover:bg-[var(--window-bg-strong)] hover:text-[var(--color-text)]"
                  >
                    <FileText size={16} />
                    임시저장
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || isUploading || !canSubmit}
                    className="inline-flex h-9 items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 text-sm font-bold text-white shadow-[var(--shadow-control)] transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    {isEditMode ? '수정하기' : '발행하기'}
                  </button>
                </div>
              </div>

              <label className="mb-2 block text-xs font-bold uppercase tracking-normal text-[var(--color-text-subtle)]">
                제목
              </label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="제목을 입력하세요"
                className="mb-5 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-control)] px-4 py-3 text-2xl font-bold tracking-normal text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-accent)] md:text-3xl"
              />

              <div className="wy-editor-shell" data-color-mode="auto">
                <MDEditor
                  value={content}
                  onChange={(value) => setContent(value || '')}
                  height={680}
                  preview="edit"
                  className="wy-markdown-editor"
                />
              </div>
            </Surface>
          </section>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <Surface strong className="p-4 shadow-none">
              <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
                <CheckCircle2 size={17} className="text-[var(--color-accent)]" />
                발행 상태
              </h2>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-control)] p-3">
                  <p className="text-lg font-bold tabular-nums text-[var(--color-text)]">{contentLength.toLocaleString()}</p>
                  <p className="text-[10px] font-semibold text-[var(--color-text-subtle)]">글자</p>
                </div>
                <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-control)] p-3">
                  <p className="text-lg font-bold tabular-nums text-[var(--color-text)]">{wordCount.toLocaleString()}</p>
                  <p className="text-[10px] font-semibold text-[var(--color-text-subtle)]">단어</p>
                </div>
                <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-control)] p-3">
                  <p className="text-lg font-bold tabular-nums text-[var(--color-text)]">{readingMinutes}</p>
                  <p className="text-[10px] font-semibold text-[var(--color-text-subtle)]">분</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-[var(--color-text-muted)]">
                카테고리: <span className="font-semibold text-[var(--color-text)]">{selectedCategoryName}</span>
              </p>
            </Surface>

            <Surface strong className="p-4 shadow-none">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
                <Folder size={17} />
                카테고리
              </h2>
              <div className="max-h-64 overflow-y-auto rounded-lg border border-[var(--color-line)] bg-[var(--color-control)] p-2">
                {categories.length > 0 ? (
                  <CategoryOptions categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
                ) : (
                  <div className="flex min-h-24 items-center justify-center text-sm text-[var(--color-text-subtle)]">
                    불러오는 중...
                  </div>
                )}
              </div>
            </Surface>

            <Surface strong className="p-4 shadow-none">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
                <Tags size={17} />
                태그
              </h2>
              <input
                type="text"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="react, nextjs, essay"
                className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-control)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-accent)]"
              />
              <p className="mt-2 text-xs text-[var(--color-text-subtle)]">쉼표로 구분해서 입력하세요.</p>
            </Surface>

            <Surface strong className="p-4 shadow-none">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
                <ImageIcon size={17} />
                이미지
              </h2>
              <label
                className={`flex min-h-28 w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-line)] bg-[var(--color-control)] p-4 text-center transition hover:border-[var(--color-accent)] hover:bg-[var(--window-bg-strong)] ${isUploading ? 'cursor-wait opacity-60' : ''}`}
              >
                <UploadCloud className="mb-2 h-7 w-7 text-[var(--color-text-subtle)]" />
                <span className="text-sm font-semibold text-[var(--color-text)]">
                  {isUploading ? '업로드 중...' : '이미지 선택'}
                </span>
                <span className="mt-1 text-xs leading-5 text-[var(--color-text-subtle)]">
                  파일 선택 또는 에디터에 붙여넣기
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
            </Surface>

            <Surface strong className="overflow-hidden shadow-none">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] px-4 py-3">
                <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
                  <Clock size={17} />
                  임시저장
                </h2>
                <button
                  type="button"
                  onClick={() => setShowDraftList((previous) => !previous)}
                  className="rounded-full border border-[var(--color-line)] bg-[var(--color-control)] px-2.5 py-1 text-xs font-bold text-[var(--color-text-muted)] transition hover:bg-[var(--window-bg-strong)] hover:text-[var(--color-text)]"
                >
                  {drafts.length}/10
                </button>
              </div>

              {showDraftList ? (
                <div className="max-h-72 overflow-y-auto p-2">
                  {drafts.length === 0 ? (
                    <div className="flex min-h-24 items-center justify-center text-sm text-[var(--color-text-subtle)]">
                      저장된 글이 없습니다.
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {drafts.map((draft) => (
                        <li key={draft.id} className="group rounded-lg px-3 py-2 transition hover:bg-black/[0.04] dark:hover:bg-white/10">
                          <div className="flex items-start justify-between gap-2">
                            <button type="button" onClick={() => handleLoadDraft(draft)} className="min-w-0 flex-1 text-left">
                              <p className="line-clamp-1 text-sm font-semibold text-[var(--color-text)]">{draft.title}</p>
                              <p className="mt-1 text-xs text-[var(--color-text-subtle)]">{draft.savedAt}</p>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDraft(draft.id)}
                              className="rounded p-1.5 text-[var(--color-text-subtle)] transition hover:bg-[var(--color-danger-soft)] hover:text-red-500"
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
              ) : (
                <div className="p-4 text-xs leading-5 text-[var(--color-text-muted)]">
                  임시저장 목록은 필요할 때만 펼쳐 볼 수 있습니다.
                </div>
              )}
            </Surface>
          </aside>
        </div>
      </WindowSurface>

      {draftToLoad && (
        <DraftLoadDialog
          draft={draftToLoad}
          onCancel={() => setDraftToLoad(null)}
          onConfirm={confirmLoadDraft}
        />
      )}
    </main>
  );
}
