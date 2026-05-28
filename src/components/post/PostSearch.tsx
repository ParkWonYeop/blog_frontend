'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { clsx } from 'clsx';

interface PostSearchProps {
  onSearch: (keyword: string) => void;
  placeholder?: string;
  className?: string;
  initialKeyword?: string; // 🆕 URL 동기화를 위한 초기값 prop 추가
}

export default function PostSearch({ 
  onSearch, 
  placeholder = "검색어를 입력하세요...", 
  className,
  initialKeyword = '' 
}: PostSearchProps) {
  const [keyword, setKeyword] = useState(initialKeyword);

  // 🆕 부모(URL)에서 검색어가 변경되면(예: 메인으로 이동) 입력창도 동기화
  useEffect(() => {
    setKeyword(initialKeyword);
  }, [initialKeyword]);

  const handleSearch = () => {
    onSearch(keyword);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setKeyword('');
    onSearch('');
  };

  return (
    <div className={clsx("relative w-full max-w-md", className)}>
      <div className="relative">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-full border border-[var(--color-line)] bg-[var(--color-control)] py-2.5 pl-10 pr-10 text-sm text-[var(--color-text)] shadow-[var(--shadow-control)] outline-none transition-all placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-accent)] focus:bg-[var(--color-surface-strong)]"
        />
        <Search 
          className="absolute left-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-[var(--color-text-subtle)] transition-colors hover:text-[var(--color-accent)]" 
          size={18} 
          onClick={handleSearch}
        />
        {keyword && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--color-text-subtle)] transition-colors hover:bg-black/[0.06] hover:text-[var(--color-text)] dark:hover:bg-white/10"
            aria-label="검색어 지우기"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
