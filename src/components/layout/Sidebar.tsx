'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/api/category';
import { Github, Mail, Menu, X, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { clsx } from 'clsx';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true); // 사이드바 열림/닫힘 상태
  const pathname = usePathname();

  // 1. 서버에서 카테고리 데이터 가져오기
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  return (
    <>
      {/* 📱 모바일용 메뉴 토글 버튼 (화면 왼쪽 위에 고정) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-full shadow-md md:hidden hover:bg-gray-100 transition-colors"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* 🖥️ 사이드바 본체 */}
      <aside
        className={clsx(
          // 기본 스타일 & 애니메이션
          'fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-100 transition-all duration-300 ease-in-out overflow-y-auto scrollbar-hide',
          // 열렸을 때 vs 닫혔을 때 너비 조절
          isOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full md:w-20 md:translate-x-0',
          'flex flex-col'
        )}
      >
        {/* A. 프로필 영역 */}
        <div className={clsx('p-6 text-center transition-opacity duration-200', !isOpen && 'md:opacity-0 md:hidden')}>
          <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full mb-4 overflow-hidden shadow-inner ring-4 ring-gray-50">
            {/* 프로필 이미지 (임시) */}
            <img 
              src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Dev Park</h2>
          <p className="text-sm text-gray-500 mt-1">풀스택을 꿈꾸는 개발자</p>
          <p className="text-xs text-gray-400 mt-3 font-light leading-relaxed">
            "코드로 세상을 바꾸고 싶은<br />박개발의 기술 블로그입니다."
          </p>
        </div>

        {/* B. 네비게이션 & 카테고리 */}
        <nav className="flex-1 px-4 py-2">
          {/* 닫혔을 때(좁은 모드) 메뉴 아이콘 표시 */}
          <div className={clsx('flex flex-col items-center gap-4 mt-4', isOpen && 'hidden')}>
             <Folder size={24} className="text-gray-400" />
          </div>

          {/* 열렸을 때 메뉴 목록 */}
          <div className={clsx('space-y-1', !isOpen && 'md:hidden')}>
            <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 mt-4">
              Categories
            </p>
            
            {/* 로딩 중일 때 스켈레톤 UI */}
            {!categories && (
              <div className="space-y-2 px-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            )}

            {/* 실제 카테고리 렌더링 */}
            {categories?.map((cat) => {
              // 현재 카테고리(또는 자식)가 선택되었는지 확인
              const isActive = pathname.includes(`/category/${cat.id}`);
              
              return (
                <div key={cat.id} className="mb-1">
                  {/* 1차 카테고리 */}
                  <Link
                    href={`/category/${cat.id}`}
                    className={clsx(
                      'flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-all group',
                      isActive
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      {isActive ? <FolderOpen size={16} /> : <Folder size={16} />}
                      <span>{cat.name}</span>
                    </div>
                    {cat.children && cat.children.length > 0 && (
                      <ChevronRight size={14} className={clsx("text-gray-300 transition-transform", isActive && "rotate-90")} />
                    )}
                  </Link>

                  {/* 2차 카테고리 (자식이 있을 경우) */}
                  {cat.children && cat.children.length > 0 && (
                    <div className="ml-5 mt-1 space-y-0.5 border-l-2 border-gray-100 pl-2">
                      {cat.children.map((child) => {
                        const isChildActive = pathname.includes(`/category/${child.id}`);
                        return (
                          <Link
                            key={child.id}
                            href={`/category/${child.id}`}
                            className={clsx(
                              "block px-3 py-2 text-sm rounded-md transition-colors",
                              isChildActive 
                                ? "text-blue-600 font-medium bg-blue-50/50" 
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                            )}
                          >
                            - {child.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* C. 광고 영역 (거슬리지 않게 하단 배치) */}
        <div className={clsx('px-6 pb-6', !isOpen && 'hidden')}>
          <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-dashed border-gray-200 text-center relative overflow-hidden group cursor-pointer hover:border-blue-200 transition-colors">
            <div className="absolute top-0 right-0 p-1">
              <span className="text-[9px] bg-gray-200 text-gray-500 px-1 rounded">AD</span>
            </div>
            <p className="text-xs text-blue-500 font-semibold mb-1">AWS Cloud School</p>
            <p className="text-[11px] text-gray-500">
               국비지원 과정 모집중<br/>
               <span className="underline group-hover:text-blue-600">자세히 보기 &rarr;</span>
            </p>
          </div>
        </div>

        {/* D. 소셜 링크 (최하단) */}
        <div className={clsx('p-6 border-t border-gray-100 bg-white', !isOpen && 'hidden')}>
          <div className="flex justify-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 text-gray-500 bg-gray-50 rounded-full hover:bg-gray-800 hover:text-white transition-all shadow-sm hover:-translate-y-1"
              aria-label="Github"
            >
              <Github size={18} />
            </a>
            <a
              href="mailto:user@example.com"
              className="p-2.5 text-gray-500 bg-gray-50 rounded-full hover:bg-blue-500 hover:text-white transition-all shadow-sm hover:-translate-y-1"
              aria-label="Email"
            >
              <Mail size={18} />
            </a>
          </div>
          <p className="text-center text-[10px] text-gray-300 mt-4 font-light">
            © 2024 Dev Park. All rights reserved.
          </p>
        </div>
      </aside>
    </>
  );
}