'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost, updatePost, getPost } from '@/api/posts';
import { getCategories } from '@/api/category';
import { uploadImage } from '@/api/image';
import { useAuthStore } from '@/store/authStore';
import { Loader2, Save, Image as ImageIcon, ArrowLeft, Folder, UploadCloud } from 'lucide-react';
// 🎨 UX 개선: 토스트 알림 사용
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default), 
  { ssr: false }
);

function WritePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { role, _hasHydrated } = useAuthStore();

  const editSlug = searchParams.get('slug');
  const isEditMode = !!editSlug;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('**Hello world!**');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (_hasHydrated && (!role || !role.includes('ADMIN'))) {
      toast.error('관리자 권한이 필요합니다.'); // 🎨 Alert 대체
      router.push('/');
    }
  }, [role, _hasHydrated, router]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: existingPost, isLoading: isLoadingPost } = useQuery({
    queryKey: ['post', editSlug],
    queryFn: () => getPost(editSlug!),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title);
      setContent(existingPost.content || '');
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

  const mutation = useMutation({
    mutationFn: (data: any) => isEditMode ? updatePost(existingPost!.id, data) : createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      if (isEditMode) {
        queryClient.invalidateQueries({ queryKey: ['post', editSlug] });
      }
      // 🎨 UX 개선: 성공 메시지 토스트
      toast.success(isEditMode ? '게시글이 수정되었습니다.' : '게시글이 발행되었습니다!');
      router.push(isEditMode ? `/posts/${editSlug}` : '/');
    },
    onError: (err: any) => {
      // 🎨 UX 개선: 에러 메시지 토스트
      toast.error('저장 실패: ' + (err.response?.data?.message || err.message));
    },
  });

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('제목과 내용을 입력해주세요.');
      return;
    }
    if (categoryId === '') {
      toast.error('카테고리를 선택해주세요.');
      return;
    }

    mutation.mutate({
      title,
      content,
      categoryId: Number(categoryId),
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const uploadToast = toast.loading('이미지 업로드 중...'); // 🎨 업로드 로딩 표시

    try {
      const res = await uploadImage(file);
      if (res.code === 'SUCCESS' && res.data) {
        const imageUrl = res.data;
        const markdownImage = `![image](${imageUrl})`;
        setContent((prev) => prev + '\n' + markdownImage);
        toast.success('이미지가 업로드되었습니다.', { id: uploadToast }); // 로딩 토스트를 성공으로 변경
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
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? '게시글 수정' : '새 글 작성'}</h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={mutation.isPending || isUploading}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-400 shadow-md hover:shadow-lg transform active:scale-95 duration-200"
        >
          {mutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {isEditMode ? '수정하기' : '작성하기'}
        </button>
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

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm sticky top-[300px]">
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