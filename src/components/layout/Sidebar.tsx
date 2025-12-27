'use client';

import { useState, useRef, useCallback, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
// 🎨 이미지 최적화를 위해 next/image 사용
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/category';
import { getProfile, updateProfile } from '@/api/profile';
import { uploadImage } from '@/api/image';
import { 
  Github, Mail, Menu, X, ChevronRight, Folder, FolderOpen, 
  Edit3, Camera, Save, XCircle, Plus, Trash2, Move, Settings, FileQuestion,
  Archive
} from 'lucide-react';
import { clsx } from 'clsx';
import { Profile, ProfileUpdateRequest, Category } from '@/types';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import PostSearch from '@/components/post/PostSearch'; // 🆕 검색 컴포넌트 추가

const findCategoryNameById = (categories: Category[], id: number): string | undefined => {
  for (const cat of categories) {
    if (cat.id === id) return cat.name;
    if (cat.children && cat.children.length > 0) {
      const found = findCategoryNameById(cat.children, id);
      if (found) return found;
    }
  }
  return undefined;
};

interface CategoryItemProps {
  category: Category;
  depth: number;
  pathname: string;
  isEditMode: boolean;
  onDrop: (draggedId: number, targetId: number | null) => void;
  onAdd: (parentId: number) => void;
  onDelete: (id: number) => void;
}

function CategoryItem({ category, depth, pathname, isEditMode, onDrop, onAdd, onDelete }: CategoryItemProps) {
  const isActive = decodeURIComponent(pathname) === `/category/${category.name}`;
  
  const hasActiveChild = useMemo(() => {
    const check = (cats: Category[] | undefined): boolean => {
      if (!cats) return false;
      return cats.some(c => 
        decodeURIComponent(pathname) === `/category/${c.name}` || check(c.children)
      );
    };
    return check(category.children);
  }, [category.children, pathname]);

  const [isExpanded, setIsExpanded] = useState(isActive || hasActiveChild);

  useEffect(() => {
    if (isActive || hasActiveChild) {
      setIsExpanded(true);
    }
  }, [isActive, hasActiveChild]);

  const [isDragOver, setIsDragOver] = useState(false);
  
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('categoryId', category.id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isEditMode) {
        setIsDragOver(true);
        e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (!isEditMode) return;

    const draggedId = Number(e.dataTransfer.getData('categoryId'));
    if (!draggedId || draggedId === category.id) return;

    if (confirm(`'${category.name}' 하위로 이동하시겠습니까?`)) {
      onDrop(draggedId, category.id);
    }
  };

  const sortedChildren = useMemo(() => {
    if (!category.children) return [];
    return [...category.children].sort((a, b) => a.id - b.id);
  }, [category.children]);

  return (
    <div className="mb-1">
      <div 
        className={clsx(
          'flex items-center justify-between px-4 py-2 text-sm rounded-lg transition-all group relative',
          isActive && !isEditMode ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50',
          isEditMode && 'border border-dashed border-gray-300 hover:border-blue-400 cursor-move bg-white',
          isDragOver && 'bg-blue-100 border-blue-500'
        )}
        style={{ marginLeft: `${depth * 12}px` }}
        draggable={isEditMode}
        onDragStart={isEditMode ? handleDragStart : undefined}
        onDragOver={isEditMode ? handleDragOver : undefined}
        onDragLeave={isEditMode ? handleDragLeave : undefined}
        onDrop={isEditMode ? handleDrop : undefined}
      >
        {!isEditMode ? (
          <Link href={`/category/${category.name}`} className="flex-1 flex items-center gap-2.5">
            {isActive ? <FolderOpen size={16} /> : <Folder size={16} />}
            <span>{category.name}</span>
          </Link>
        ) : (
          <div className="flex-1 flex items-center gap-2.5">
            <Move size={14} className="text-gray-400" />
            <span>{category.name}</span>
          </div>
        )}

        {isEditMode && (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onAdd(category.id); }}
              className="p-1 text-green-600 hover:bg-green-100 rounded"
              title="하위 카테고리 추가"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(category.id); }}
              className="p-1 text-red-500 hover:bg-red-100 rounded"
              title="카테고리 삭제"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        {!isEditMode && category.children && category.children.length > 0 && (
          <button
            onClick={(e) => {
              e.preventDefault(); 
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 hover:bg-gray-200/50 rounded-full transition-colors ml-1"
          >
            <ChevronRight 
              size={14} 
              className={clsx(
                "text-gray-400 transition-transform duration-200", 
                isExpanded && "rotate-90"
              )} 
            />
          </button>
        )}
      </div>

      {isExpanded && sortedChildren.length > 0 && (
        <div className="border-l-2 border-gray-100 ml-4 animate-in slide-in-from-top-1 duration-200 fade-in">
          {sortedChildren.map((child) => (
            <CategoryItem 
              key={child.id} 
              category={child} 
              depth={0}
              pathname={pathname}
              isEditMode={isEditMode}
              onDrop={onDrop}
              onAdd={onAdd}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarContent() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const { role, _hasHydrated } = useAuthStore();
  const queryClient = useQueryClient();
  
  // 🆕 검색 로직 추가
  const router = useRouter();
  const searchParams = useSearchParams();
  const keyword = searchParams.get('keyword') || '';

  const handleSearch = (newKeyword: string) => {
    if (newKeyword.trim()) {
      router.push(`/?keyword=${encodeURIComponent(newKeyword.trim())}`);
    } else {
      router.push('/');
    }
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<ProfileUpdateRequest>({
    name: '', bio: '', imageUrl: '', githubUrl: '', email: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCategoryEditMode, setIsCategoryEditMode] = useState(false);
  const [isRootDragOver, setIsRootDragOver] = useState(false);
  
  const isAdmin = _hasHydrated && role?.includes('ADMIN');

  useEffect(() => {
    if (!isAdmin) {
      setIsCategoryEditMode(false);
      setIsEditModalOpen(false);
    }
  }, [isAdmin]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const sortedCategories = useMemo(() => {
    if (!categories) return undefined;
    return [...categories].sort((a, b) => a.id - b.id);
  }, [categories]);

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    retry: 0,
  });

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('카테고리가 생성되었습니다.');
    },
    onError: (err: any) => toast.error('생성 실패: ' + (err.response?.data?.message || err.message)),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateCategory(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    onError: (err: any) => toast.error('이동 실패: ' + (err.response?.data?.message || err.message)),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('카테고리가 삭제되었습니다.');
    },
    onError: (err: any) => toast.error('삭제 실패: ' + (err.response?.data?.message || err.message)),
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditModalOpen(false);
      toast.success('프로필이 수정되었습니다!');
    },
    onError: (error: any) => toast.error('수정 실패: ' + (error.response?.data?.message || error.message)),
  });

  const handleAddCategory = (parentId: number | null) => {
    const name = prompt('새 카테고리 이름을 입력하세요:'); 
    if (!name || !name.trim()) return;
    createCategoryMutation.mutate({ name, parentId });
  };

  const handleDeleteCategory = (id: number) => {
    if (confirm('정말로 이 카테고리를 삭제하시겠습니까?\n하위 카테고리와 게시글이 모두 삭제될 수 있습니다.')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleMoveCategory = useCallback((draggedId: number, targetParentId: number | null) => {
    if (draggedId === targetParentId) return;
    if (!categories) return;

    const currentName = findCategoryNameById(categories, draggedId);
    if (!currentName) {
      toast.error('카테고리 정보를 찾을 수 없습니다.');
      return;
    }

    updateCategoryMutation.mutate({ 
      id: draggedId, 
      data: { name: currentName, parentId: targetParentId }
    });
  }, [categories, updateCategoryMutation]);

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsRootDragOver(false);
    const draggedId = Number(e.dataTransfer.getData('categoryId'));
    if (!draggedId) return;

    if (confirm('이 카테고리를 최상위로 이동하시겠습니까?')) {
      handleMoveCategory(draggedId, null);
    }
  };

  const defaultProfile: Profile = {
    name: 'Dev Park',
    bio: '풀스택을 꿈꾸는 개발자\n"코드로 세상을 바꾸고 싶은 박개발의 기술 블로그입니다."',
    imageUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Felix',
    githubUrl: 'https://github.com',
    email: 'user@example.com',
  };

  const displayProfile = profile ? { ...defaultProfile, ...profile } : defaultProfile;
  
  const handleEditClick = () => {
    setEditForm({
      name: displayProfile.name,
      bio: displayProfile.bio,
      imageUrl: displayProfile.imageUrl,
      githubUrl: displayProfile.githubUrl || '',
      email: displayProfile.email || '',
    });
    setIsEditModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadImage(file);
      if (res.code === 'SUCCESS' && res.data) {
        setEditForm((prev) => ({ ...prev, imageUrl: res.data }));
      }
    } catch (error) {
      toast.error('이미지 업로드 오류');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(editForm);
  };

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="fixed top-4 left-4 z-50 p-2 bg-white rounded-full shadow-md md:hidden hover:bg-gray-100 transition-colors">
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={clsx('fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-100 transition-all duration-300 ease-in-out overflow-y-auto scrollbar-hide', isOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full md:w-20 md:translate-x-0', 'flex flex-col')}>
        <div className={clsx('p-6 text-center transition-opacity duration-200 relative group', !isOpen && 'md:opacity-0 md:hidden')}>
          {isAdmin && (
            <button onClick={handleEditClick} className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10" title="프로필 수정">
              <Edit3 size={16} />
            </button>
          )}
          <Link href="/" className="block hover:opacity-80 transition-opacity">
            <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full mb-4 overflow-hidden shadow-inner ring-4 ring-gray-50 relative">
              {isProfileLoading ? (
                <div className="w-full h-full bg-gray-200 animate-pulse" />
              ) : (
                <Image 
                  src={displayProfile.imageUrl || defaultProfile.imageUrl!} 
                  alt="Profile" 
                  fill
                  sizes="96px"
                  className="object-cover"
                  unoptimized
                  priority
                />
              )}
            </div>
            {isProfileLoading ? (
              <div className="space-y-2 flex flex-col items-center"><div className="h-6 w-24 bg-gray-200 rounded animate-pulse" /><div className="h-4 w-32 bg-gray-100 rounded animate-pulse" /></div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-800">{displayProfile.name}</h2>
                <p className="text-sm text-gray-500 mt-1 whitespace-pre-line leading-relaxed">{displayProfile.bio}</p>
              </>
            )}
          </Link>
        </div>

        <nav className="flex-1 px-4 py-2 flex flex-col">
          <div className={clsx('flex flex-col items-center gap-4 mt-4', isOpen && 'hidden')}><Folder size={24} className="text-gray-400" /></div>
          
          <div className={clsx('space-y-1 flex-1', !isOpen && 'md:hidden')}>
            
            {/* 🆕 전체 검색바 (Archives 위) - 수정됨: 그림자 제거 */}
            <div className="px-1 mb-6 mt-2">
              <PostSearch 
                onSearch={handleSearch} 
                placeholder="검색..." 
                initialKeyword={keyword}
                // className="shadow-sm" // 🎨 제거됨: 배경 박스처럼 보이는 문제 해결
              />
            </div>

            {/* 2. 아카이브 링크 */}
            <div className="mb-4">
              <Link 
                href="/archive"
                className={clsx(
                  'flex items-center gap-2.5 px-4 py-2 text-sm rounded-lg transition-all group',
                  pathname === '/archive'
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <Archive size={16} />
                <span>Archives</span>
              </Link>
            </div>

            {/* 구분선 */}
            <div className="border-t border-gray-100 mb-4" />

            {/* 1. 카테고리 섹션 */}
            <div className="flex items-center justify-between px-4 mb-3 h-8">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Categories</p>
              {isAdmin && (
                <div className="flex items-center gap-1">
                  {!isCategoryEditMode ? (
                    <button onClick={() => setIsCategoryEditMode(true)} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="카테고리 관리"><Settings size={14} /></button>
                  ) : (
                    <>
                      <button onClick={() => handleAddCategory(null)} className="p-1 text-green-600 hover:bg-green-100 rounded" title="최상위 카테고리 추가"><Plus size={16} /></button>
                      <button onClick={() => setIsCategoryEditMode(false)} className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="관리 종료"><X size={16} /></button>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {!categories && <div className="space-y-2 px-4">{[1, 2, 3].map((i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}</div>}

            <div 
              className={clsx("min-h-[50px] transition-colors rounded-lg mb-6", isCategoryEditMode && "border-2 border-dashed", isRootDragOver ? "border-blue-500 bg-blue-50" : "border-transparent")}
              onDragOver={isCategoryEditMode ? (e) => { e.preventDefault(); setIsRootDragOver(true); e.dataTransfer.dropEffect = 'move'; } : undefined}
              onDragLeave={isCategoryEditMode ? (e) => { e.preventDefault(); setIsRootDragOver(false); } : undefined}
              onDrop={isCategoryEditMode ? handleRootDrop : undefined}
            >
              {sortedCategories?.map((cat) => (
                <CategoryItem key={cat.id} category={cat} depth={0} pathname={pathname} isEditMode={isCategoryEditMode} onDrop={handleMoveCategory} onAdd={handleAddCategory} onDelete={handleDeleteCategory} />
              ))}
              
              {!isCategoryEditMode && (
                <div className="mb-1 mt-2">
                  <Link
                    href="/category/uncategorized"
                    className={clsx(
                      'flex items-center gap-2.5 px-4 py-2 text-sm rounded-lg transition-all',
                      pathname === '/category/uncategorized'
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <FileQuestion size={16} />
                    <span>미분류</span>
                  </Link>
                </div>
              )}
              {isCategoryEditMode && categories?.length === 0 && <div className="text-center text-xs text-gray-400 py-4">+ 버튼을 눌러 카테고리를 추가하세요.</div>}
            </div>
          </div>
        </nav>

        <div className={clsx('p-6 border-t border-gray-100 bg-white', !isOpen && 'hidden')}>
          <div className="flex justify-center gap-3">
            <a href={displayProfile.githubUrl || '#'} target="_blank" rel="noreferrer" className="p-2.5 text-gray-500 bg-gray-50 rounded-full hover:bg-gray-800 hover:text-white transition-all shadow-sm"><Github size={18} /></a>
            <a href={`mailto:${displayProfile.email}`} className="p-2.5 text-gray-500 bg-gray-50 rounded-full hover:bg-blue-500 hover:text-white transition-all shadow-sm"><Mail size={18} /></a>
          </div>
          <p className="text-center text-[10px] text-gray-300 mt-4 font-light">© 2024 {displayProfile.name}. All rights reserved.</p>
        </div>
      </aside>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Edit3 size={18} className="text-blue-600" /> 프로필 수정</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-24 h-24 mb-3 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <Image src={editForm.imageUrl || defaultProfile.imageUrl!} alt="Preview" fill className="rounded-full object-cover border-2 border-gray-100 group-hover:border-blue-300 transition-colors" unoptimized />
                  <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"><Camera className="text-white" size={24} /></div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs text-blue-600 font-medium hover:underline" disabled={isUploading}>{isUploading ? '업로드 중...' : '이미지 변경'}</button>
              </div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">이름 (Name)</label><input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-sm" required /></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">소개 (Bio)</label><textarea value={editForm.bio} onChange={(e) => setEditForm({...editForm, bio: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-sm resize-none h-24" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Github URL</label><input type="url" value={editForm.githubUrl || ''} onChange={(e) => setEditForm({...editForm, githubUrl: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-sm" /></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Email</label><input type="email" value={editForm.email || ''} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-sm" /></div>
              </div>
              <div className="pt-4 flex gap-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">취소</button>
                <button type="submit" disabled={updateProfileMutation.isPending || isUploading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:bg-gray-400 flex justify-center items-center gap-2">{updateProfileMutation.isPending ? '저장 중...' : <><Save size={16} /> 저장하기</>}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={<div className="w-72 h-screen bg-white border-r border-gray-100" />}>
      <SidebarContent />
    </Suspense>
  );
}