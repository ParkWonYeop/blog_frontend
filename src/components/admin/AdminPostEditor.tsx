'use client';

import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, FileText, Loader2, Save } from 'lucide-react';
import { getCategories } from '@/api/category';
import { refreshAccessToken } from '@/api/authSession';
import { uploadImage } from '@/api/image';
import { createPost, getPost, updatePost } from '@/api/posts';
import DraftLoadDialog from '@/components/admin/post-editor/DraftLoadDialog';
import PostEditorSidebar from '@/components/admin/post-editor/PostEditorSidebar';
import type { DraftPost } from '@/components/admin/post-editor/types';
import { usePostDrafts } from '@/components/admin/post-editor/usePostDrafts';
import { useTheme } from '@/components/theme/ThemeProvider';
import Surface from '@/components/ui/Surface';
import WindowSurface from '@/components/ui/WindowSurface';
import { findCategoryById, findCategoryByName } from '@/lib/categories';
import { getPrefixedErrorMessage } from '@/lib/errors';
import { isTokenExpired } from '@/lib/authToken';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';
import type { ApiResponse, Post, PostSaveRequest } from '@/types';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false },
);

interface AdminPostEditorProps {
  editSlug?: string;
}

export default function AdminPostEditor({ editSlug }: AdminPostEditorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();
  const { isLoggedIn, role, _hasHydrated, accessToken } = useAuthStore();
  const isAdmin = _hasHydrated && Boolean(role?.includes('ADMIN'));
  const isEditMode = Boolean(editSlug);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [tags, setTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { drafts, saveDrafts, deleteDraft } = usePostDrafts();
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

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: getCategories,
    enabled: isAdmin,
  });

  const { data: existingPost, isLoading: isLoadingPost } = useQuery({
    queryKey: queryKeys.posts.detail(editSlug),
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
    deleteDraft(id);
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

      await queryClient.resetQueries({ queryKey: queryKeys.posts.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });

      if (editSlug) {
        queryClient.removeQueries({ queryKey: queryKeys.posts.detail(editSlug) });
      }
      if (newSlug && newSlug !== editSlug) {
        queryClient.removeQueries({ queryKey: queryKeys.posts.detail(newSlug) });
      }

      toast.success(isEditMode ? '게시글을 수정했습니다.' : '게시글을 발행했습니다.');
      router.push(newSlug ? `/posts/${newSlug}` : '/admin');
    },
    onError: (error) => {
      toast.error(getPrefixedErrorMessage(error, '저장 실패'));
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const ensureAuthToken = async (): Promise<boolean> => {
    if (!accessToken) {
      toast.error('로그인이 필요합니다.');
      return false;
    }

    if (!isTokenExpired(accessToken, 30)) return true;

    try {
      await refreshAccessToken();
      return true;
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
      toast.error(getPrefixedErrorMessage(error, '이미지 업로드 실패'), { id: uploadToast });
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
        toast.error(getPrefixedErrorMessage(error, '이미지 업로드 실패'), { id: uploadToast });
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
    <div className="w-full min-w-0" onPaste={handlePaste}>
      <WindowSurface
        title={isEditMode ? '글 수정' : '새 글 작성'}
        subtitle="Markdown Studio"
        controls={(
          <button
            type="button"
            onClick={() => router.push('/admin/posts')}
            className="inline-flex h-8 items-center gap-2 rounded-full border border-[var(--control-border)] bg-[var(--color-control)] px-3 text-xs font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)]"
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
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--control-border)] bg-[var(--color-control)] px-4 text-sm font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)]"
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
                className="mb-5 w-full rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-4 py-3 text-2xl font-bold tracking-normal text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-accent)] md:text-3xl"
              />

              <div className="wy-editor-shell" data-color-mode={resolvedTheme}>
                <MDEditor
                  value={content}
                  onChange={(value) => setContent(value || '')}
                  height={680}
                  preview="edit"
                  data-color-mode={resolvedTheme}
                  textareaProps={{
                    style: {
                      color: 'var(--color-text)',
                      WebkitTextFillColor: 'var(--color-text)',
                      caretColor: 'var(--color-accent)',
                      background: 'transparent',
                    },
                  }}
                  className="wy-markdown-editor"
                />
              </div>
            </Surface>
          </section>

          <PostEditorSidebar
            contentLength={contentLength}
            wordCount={wordCount}
            readingMinutes={readingMinutes}
            selectedCategoryName={selectedCategoryName}
            categories={categories}
            categoryId={categoryId}
            onCategoryChange={setCategoryId}
            tags={tags}
            onTagsChange={setTags}
            isUploading={isUploading}
            onFileChange={handleFileChange}
            drafts={drafts}
            showDraftList={showDraftList}
            onToggleDraftList={() => setShowDraftList((previous) => !previous)}
            onLoadDraft={handleLoadDraft}
            onDeleteDraft={handleDeleteDraft}
          />
        </div>
      </WindowSurface>

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
