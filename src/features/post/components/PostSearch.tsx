'use client';

import { useEffect, useId, useState } from 'react';
import { Search, X } from 'lucide-react';
import { clsx } from 'clsx';

interface PostSearchProps {
  onSearch: (keyword: string) => void;
  placeholder?: string;
  className?: string;
  initialKeyword?: string;
  shortcutKey?: string;
}

export default function PostSearch({
  onSearch,
  placeholder = '검색어를 입력해 주세요',
  className,
  initialKeyword = '',
  shortcutKey,
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
    <form onSubmit={handleSubmit} role="search" className={clsx('relative w-full', className)}>
      <label htmlFor={inputId} className="sr-only">게시글 검색</label>
      <input
        id={inputId}
        type="search"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-keyshortcuts={shortcutKey}
        className="peer h-11 w-full rounded-xl border pl-10 pr-10 text-body2 text-[var(--color-text)] outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      <button
        type="submit"
        className="absolute left-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--color-text-subtle)] transition-colors hover:text-[var(--color-text)]"
        aria-label="검색"
      >
        <Search size={18} />
      </button>
      {shortcutKey && !keyword && (
        <kbd
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 hidden h-6 min-w-6 -translate-y-1/2 items-center justify-center rounded-sm border border-[var(--card-border)] bg-[var(--color-page)] px-1.5 font-pixel text-pixel-s text-[var(--color-text-subtle)] peer-focus:hidden md:flex"
        >
          {shortcutKey}
        </kbd>
      )}
      {keyword && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--color-text-subtle)] transition-colors hover:text-[var(--color-text)]"
          aria-label="검색어 지우기"
        >
          <X size={16} />
        </button>
      )}
    </form>
  );
}
