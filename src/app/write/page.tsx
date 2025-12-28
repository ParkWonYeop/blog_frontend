'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost, updatePost, getPost } from '@/api/posts';
import { getCategories } from '@/api/category';
import { uploadImage } from '@/api/image';
import { useAuthStore } from '@/store/authStore';
import { Loader2, Save, Image as ImageIcon, ArrowLeft, Folder, UploadCloud, FileText, Trash2, X, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import axios from 'axios';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default), 
  { ssr: false }
);

// 🛠️ 임시저장 데이터 타입 정의
interface DraftPost {
  id: number;
  title: string;
  content: string;
  savedAt: string;
}

// 🛠️ 1. 토큰 만료 체크 유틸리티
function isTokenExpired(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const { exp } = JSON.parse(jsonPayload);
    return Date.now() / 1000 >= exp - 30;
  } catch (e) {
    return true;
  }
}

function WritePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { role, _hasHydrated, accessToken, refreshToken, login } = useAuthStore();

  const editSlug = searchParams.get('slug');
  const isEditMode = !!editSlug;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('**Hello world!**');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [tags, setTags] = useState(''); 
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 💾 임시저장 관련 상태
  const [drafts, setDrafts] = useState<DraftPost[]>([]);
  const [showDraftList, setShowDraftList] = useState(false);

  useEffect(() => {
    if (_hasHydrated && (!role || !role.includes('ADMIN'))) {
      toast.error('관리자 권한이 필요합니다.');
      router.push('/');
    }
  }, [role, _hasHydrated, router]);

  // 컴포넌트 마운트 시 로컬스토리지에서 임시저장 목록 불러오기
  useEffect(() => {
    const savedDrafts = localStorage.getItem('temp_drafts');
    if (savedDrafts) {
      try {
        setDrafts(JSON.parse(savedDrafts));
      } catch (e) {
        console.error('Failed to parse drafts', e);
      }
    }
  }, []);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: existingPost, isLoading: isLoadingPost } = useQuery({
    queryKey: ['post', editSlug],
    queryFn: () => getPost(editSlug!),
    enabled: isEditMode,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always'
  });

  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title || '');
      setContent(existingPost.content || '');
      setTags(existingPost.tags ? existingPost.tags.join(', ') : '');
      
      if (categories && existingPost.categoryName) {
        const found = findCategoryByName(categories, existingPost.categoryName);
        if (found) setCategoryId(found.id);
      }
    }
  }, [existingPost, categories]);

  const findCategoryByName = (cats: any[], name: string): any => {
    for (const cat of cats) {
      if (cat.name === name) return cat;
      if (cat.children) {
        const found = findCategoryByName(cat.children, name);
        if (found) return found;
      }
    }
    return null;
  };

  // 💾 임시저장 기능
  const handleTempSave = () => {
    if (!title.trim() && !content.trim()) {
      toast.error('제목이나 내용을 입력해주세요.');
      return;
    }

    if (drafts.length >= 10) {
      toast.error('임시저장은 최대 10개까지만 가능합니다.\n기존 저장분을 삭제해주세요.');
      setShowDraftList(true); // 목록 열어주기
      return;
    }

    const newDraft: DraftPost = {
      id: Date.now(),
      title: title || '(제목 없음)',
      content: content,
      savedAt: new Date().toLocaleString(),
    };

    const newDrafts = [newDraft, ...drafts];
    setDrafts(newDrafts);
    localStorage.setItem('temp_drafts', JSON.stringify(newDrafts));
    toast.success('임시저장 되었습니다!');
  };

  // 💾 임시저장 불러오기
  const handleLoadDraft = (draft: DraftPost) => {
    if (confirm('현재 작성 중인 내용이 사라집니다.\n선택한 임시저장 글을 불러오시겠습니까?')) {
      setTitle(draft.title === '(제목 없음)' ? '' : draft.title);
      setContent(draft.content);
      setShowDraftList(false);
      toast.success('불러오기 완료');
    }
  };

  // 💾 임시저장 삭제
  const handleDeleteDraft = (id: number) => {
    const newDrafts = drafts.filter(d => d.id !== id);
    setDrafts(newDrafts);
    localStorage.setItem('temp_drafts', JSON.stringify(newDrafts));
    toast.success('삭제되었습니다.');
  };

  const mutation = useMutation({
    mutationFn: (data: any) => isEditMode ? updatePost(existingPost!.id, data) : createPost(data),
    onSuccess: async (response: any) => { 
      const savedPost = response?.data;
      const newSlug = savedPost?.slug || editSlug;

      await queryClient.resetQueries({ queryKey: ['posts'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      
      if (editSlug) {
        queryClient.removeQueries({ queryKey: ['post', editSlug] });
      }
      if (newSlug && newSlug !== editSlug) {
        queryClient.removeQueries({ queryKey: ['post', newSlug] });
      }

      toast.success(isEditMode ? '게시글이 수정되었습니다.' : '게시글이 발행되었습니다!');
      router.push(isEditMode ? `/posts/${newSlug}` : '/');
    },
    onError: (err: any) => {
      toast.error('저장 실패: ' + (err.response?.data?.message || err.message));
    },
    onSettled: () => {
        setIsSubmitting(false);
    }
  });

  const ensureAuthToken = async (): Promise<boolean> => {
    if (!accessToken || !refreshToken) {
      toast.error('로그인이 필요합니다.');
      return false;
    }

    if (!isTokenExpired(accessToken)) {
      return true;
    }

    try {
      console.log('🔄 Access token expired during write. Refreshing...');
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      
      const { data } = await axios.post(
        `${BASE_URL}/api/auth/reissue`,
        { accessToken, refreshToken },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      );

      if (data.code === 'SUCCESS' && data.data) {
        login(data.data.accessToken, data.data.refreshToken);
        console.log('✅ Token refreshed successfully before save.');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to refresh token before save:', error);
      toast.error('세션이 만료되었습니다.\n작성 중인 글을 복사해두고 다시 로그인해주세요!', { duration: 5000 });
      return false;
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
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const uploadToast = toast.loading('이미지 업로드 중...');

    try {
      await ensureAuthToken();
      
      const res = await uploadImage(file);
      if (res.code === 'SUCCESS' && res.data) {
        const imageUrl = res.data;
        const markdownImage = `![image](${imageUrl})`;
        setContent((prev) => prev + '\n' + markdownImage);
        toast.success('이미지가 업로드되었습니다.', { id: uploadToast });
      }
    } catch (error) {
      toast.error('이미지 업로드 실패', { id: uploadToast });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const onPaste = async (event: any) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        event.preventDefault();
        const file = item.getAsFile();
        if (!file) return;

        setIsUploading(true);
        const uploadToast = toast.loading('이미지 업로드 중...');

        try {
          await ensureAuthToken();

          const res = await uploadImage(file);
          if (res.code === 'SUCCESS' && res.data) {
            const imageUrl = res.data;
            const markdownImage = `![image](${imageUrl})`;
            setContent((prev) => prev + '\n' + markdownImage);
            toast.success('이미지 붙여넣기 완료!', { id: uploadToast });
          }
        } catch (error) {
          toast.error('이미지 업로드 실패', { id: uploadToast });
        } finally {
          setIsUploading(false);
        }
      }
    }
  };

  if (isEditMode && isLoadingPost) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  const renderCategoryOptions = (cats: any[], depth = 0) => {
    return cats.map((cat) => (
      <div key={cat.id}>
        <label className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer rounded transition-colors">
          <input
            type="radio"
            name="category"
            value={cat.id}
            checked={categoryId === cat.id}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            className="text-blue-600 focus:ring-blue-500"
          />
          <span style={{ marginLeft: depth * 10 + 'px' }} className={depth === 0 ? 'font-medium' : 'text-gray-600'}>
            {depth > 0 && '- '} {cat.name}
          </span>
        </label>
        {cat.children && renderCategoryOptions(cat.children, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" onPaste={onPaste}>
      {/* 상단 헤더 영역 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? '게시글 수정' : '새 글 작성'}</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 💾 임시저장 버튼 그룹 */}
          <div className="relative">
            <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm">
              <button
                onClick={handleTempSave}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-r border-gray-300 rounded-l-lg transition-colors"
                title="현재 내용 임시저장"
              >
                <FileText size={16} className="text-gray-500" />
                <span className="hidden sm:inline">임시저장</span>
              </button>
              <button
                onClick={() => setShowDraftList(!showDraftList)}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-r-lg transition-colors flex items-center gap-1"
                title="임시저장 목록 보기"
              >
                <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-bold">
                  {drafts.length}
                </span>
              </button>
            </div>

            {/* 💾 임시저장 목록 팝업 */}
            {showDraftList && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDraftList(false)} 
                />
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <h3 className="font-bold text-gray-700 text-sm">임시저장 목록 ({drafts.length}/10)</h3>
                    <button onClick={() => setShowDraftList(false)}><X size={16} className="text-gray-400 hover:text-gray-600" /></button>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {drafts.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-sm">
                        저장된 글이 없습니다.
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {drafts.map((draft) => (
                          <li key={draft.id} className="p-3 hover:bg-blue-50 transition-colors group">
                            <div className="flex justify-between items-start gap-2">
                              <button 
                                onClick={() => handleLoadDraft(draft)}
                                className="flex-1 text-left"
                              >
                                <p className="font-medium text-gray-800 text-sm line-clamp-1 mb-1 group-hover:text-blue-600">
                                  {draft.title}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                  <Clock size={12} />
                                  {draft.savedAt}
                                </div>
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteDraft(draft.id); }}
                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
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
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-400 shadow-md hover:shadow-lg transform active:scale-95 duration-200"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {isEditMode ? '수정하기' : '작성하기'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full text-3xl font-bold placeholder:text-gray-300 border-none outline-none py-2 bg-transparent"
          />
          <div data-color-mode="light">
            <MDEditor
              value={content}
              onChange={(val) => setContent(val || '')}
              height={600}
              preview="edit"
              className="border border-gray-200 rounded-lg shadow-sm !font-sans"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm sticky top-6">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Folder size={18} /> 카테고리
            </h3>
            <div className="max-h-60 overflow-y-auto space-y-1 text-sm border-t border-gray-100 pt-2 scrollbar-thin scrollbar-thumb-gray-200">
              {categories ? renderCategoryOptions(categories) : <p className="text-gray-400 text-sm">로딩 중...</p>}
            </div>
          </div>
          
          {/* 🛠️ [Legacy] 태그 입력 UI 비활성화
            사용자 요청으로 UI에서 숨김 처리 (데이터 구조는 유지)
          */}
          {/*
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm sticky top-[280px]">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
              🏷️ 태그
            </h3>
            <input 
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="태그 입력 (콤마 , 로 구분)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
            />
             <p className="text-xs text-gray-400 mt-2">예: React, Next.js, 튜토리얼</p>
          </div>
          */}

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm sticky top-[280px]">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
              <ImageIcon size={18} /> 이미지 업로드
            </h3>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              에디터에 이미지를 <br/><strong>복사 & 붙여넣기(Ctrl+V)</strong> 하거나<br/> 아래 버튼을 사용하세요.
            </p>
            
            <label 
              className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-all duration-200 ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-8 h-8 text-gray-400 mb-2 group-hover:text-blue-500" />
                <p className="text-xs text-gray-500 font-medium">
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
    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-blue-500" /></div>}>
      <WritePageContent />
    </Suspense>
  );
}