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
          className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder:text-gray-400"
        />
        <Search 
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-blue-500 transition-colors" 
          size={18} 
          onClick={handleSearch}
        />
        {keyword && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}