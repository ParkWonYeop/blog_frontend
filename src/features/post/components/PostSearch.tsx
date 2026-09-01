'use client';

import { useEffect, useId, useState } from 'react';
import { Search, X } from 'lucide-react';
import { clsx } from 'clsx';

interface PostSearchProps {
  onSearch: (keyword: string) => void;
  placeholder?: string;
  className?: string;
  initialKeyword?: string;
}

export default function PostSearch({
  onSearch,
  placeholder = '검색어를 입력하세요...',
  className,
  initialKeyword = '',
}: PostSearchProps) {
  const inputId = useId();
  const [keyword, setKeyword] = useState(initialKeyword);

  useEffect(() => {
    setKeyword(initialKeyword);
  }, [initialKeyword]);

  const handleSearch = () => {
    onSearch(keyword);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    handleSearch();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;

    event.preventDefault();
    handleSearch();
  };

  const handleClear = () => {
    setKeyword('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className={clsx('relative w-full max-w-md', className)}>
      <div className="relative">
        <label htmlFor={inputId} className="sr-only">게시글 검색</label>
        <input
          id={inputId}
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-full border border-[var(--control-border)] bg-[var(--color-control)] py-2.5 pl-10 pr-10 text-sm text-[var(--color-text)] shadow-[var(--shadow-control)] outline-none transition-all placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-accent)] focus:bg-[var(--card-bg-strong)]"
        />
        <button
          type="submit"
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--color-text-subtle)] transition-colors hover:text-[var(--color-accent)]"
          aria-label="검색"
        >
          <Search size={18} />
        </button>
        {keyword && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--card-bg)] hover:text-[var(--color-text)]"
            aria-label="검색어 지우기"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </form>
  );
}
