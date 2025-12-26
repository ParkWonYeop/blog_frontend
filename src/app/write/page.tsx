'use client';

import { useState, useEffect, Fragment, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { getCategories } from '@/api/category';
import { createPost } from '@/api/posts';
import { uploadImage } from '@/api/image'; // 👈 추가
import { useAuthStore } from '@/store/authStore';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, PhotoIcon } from '@heroicons/react/20/solid'; // 👈 아이콘 추가
import { clsx } from 'clsx';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

export default function WritePage() {
  const router = useRouter();
  const { role, _hasHydrated } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null); // 👈 파일 입력 참조
  
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [content, setContent] = useState<string>('**여기에 내용을 작성하세요.**');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // 👈 이미지 업로드 상태

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const selectedCategoryName = (() => {
    if (!categoryId || !categories) return '카테고리 선택';
    for (const cat of categories) {
      if (cat.id === categoryId) return cat.name;
      if (cat.children) {
        const child = cat.children.find(c => c.id === categoryId);
        if (child) return child.name;
      }
    }
    return '카테고리 선택';
  })();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!role || !role.includes('ADMIN')) {
      alert('관리자만 접근 가능합니다.');
      router.replace('/');
    }
  }, [role, _hasHydrated, router]);

  // 👇 이미지 업로드 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. 서버로 이미지 전송
      const res = await uploadImage(file);
      
      if (res.code === 'SUCCESS' && res.data) {
        const imageUrl = res.data; // 서버가 준 이미지 URL
        
        // 2. 본문에 마크다운 이미지 문법 삽입
        // 현재 내용 뒤에 추가하거나, 커서 위치를 찾아서 넣을 수 있습니다.
        // 여기서는 간단히 맨 뒤에 한 줄 띄우고 추가합니다.
        const imageMarkdown = `\n![${file.name}](${imageUrl})\n`;
        setContent((prev) => prev + imageMarkdown);
      } else {
        alert('이미지 업로드 실패: ' + res.message);
      }
    } catch (error) {
      console.error(error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      // 같은 파일을 다시 선택할 수 있도록 input 초기화
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert('제목을 입력해주세요.');
    if (!categoryId) return alert('카테고리를 선택해주세요.');
    if (!content.trim()) return alert('내용을 입력해주세요.');
    if (!confirm('글을 발행하시겠습니까?')) return;

    setIsSubmitting(true);
    try {
      await createPost({ title, content, categoryId });
      alert('글이 성공적으로 발행되었습니다! 🎉');
      router.push('/');
    } catch (error: any) {
      console.error(error);
      alert('에러 발생: ' + (error.response?.data?.message || '서버 오류'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!_hasHydrated || !role) {
    return <div className="min-h-screen flex justify-center items-center">로딩 중...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 z-10 relative">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">새 글 작성 ✍️</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-20">
          <div className="col-span-1">
            <Listbox value={categoryId} onChange={setCategoryId}>
              <div className="relative mt-1">
                <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-3 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm transition-all shadow-sm">
                  <span className={clsx("block truncate", !categoryId && "text-gray-400")}>
                    {selectedCategoryName}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </span>
                </Listbox.Button>
                
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute mt-2 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50">
                    {categories?.map((cat) => (
                      <Fragment key={cat.id}>
                        <div className="px-4 py-2 text-xs font-bold text-gray-500 bg-gray-50 uppercase tracking-wider">
                          {cat.name}
                        </div>
                        
                        <Listbox.Option
                          value={cat.id}
                          className={({ active }) =>
                            clsx(
                              'relative cursor-default select-none py-2.5 pl-10 pr-4',
                              active ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                            )
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={clsx('block truncate font-medium', selected && 'text-blue-600')}>
                                {cat.name} (전체)
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                              )}
                            </>
                          )}
                        </Listbox.Option>

                        {cat.children?.map((child) => (
                          <Listbox.Option
                            key={child.id}
                            value={child.id}
                            className={({ active }) =>
                              clsx(
                                'relative cursor-default select-none py-2.5 pl-10 pr-4',
                                active ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                              )
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span className={clsx('block truncate ml-4 border-l-2 border-gray-200 pl-3', selected && 'font-semibold text-blue-600 border-blue-600')}>
                                  {child.name}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                  </span>
                                )}
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </Fragment>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="col-span-3 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg shadow-sm"
          />
        </div>

        <div className="relative z-10">
          {/* 👇 이미지 업로드 버튼 영역 추가 */}
          <div className="flex justify-end mb-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm"
            >
              {isUploading ? (
                <span className="animate-pulse">업로드 중...</span>
              ) : (
                <>
                  <PhotoIcon className="w-4 h-4" />
                  <span>이미지 추가</span>
                </>
              )}
            </button>
          </div>

          <div data-color-mode="light" className="editor-container">
            <MDEditor value={content} onChange={(val) => setContent(val || '')} height={500} preview="live" className="rounded-lg border border-gray-200 shadow-sm" />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8 relative z-10">
           <button type="button" onClick={() => router.back()} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-medium transition-colors">취소</button>
           <button type="submit" disabled={isSubmitting || isUploading} className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md transition-all transform hover:-translate-y-1 disabled:bg-gray-400">{isSubmitting ? '발행 중...' : '글 발행하기 🚀'}</button>
        </div>
      </form>
    </div>
  );
}