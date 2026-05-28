'use client';

import { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
// 🛠️ 중요: rehype-slug와 동일한 ID 생성을 위해 라이브러리 사용
// npm install github-slugger 실행 필요
import GithubSlugger from 'github-slugger';

interface TOCProps {
  content: string;
}

interface HeadingItem {
  text: string;
  level: number;
  slug: string;
}

export default function TOC({ content }: TOCProps) {
  const [activeId, setActiveId] = useState<string>('');

  // 1. 마크다운에서 헤딩(#) 추출 및 Slug 생성
  const headings = useMemo(() => {
    const slugger = new GithubSlugger(); // Slugger 인스턴스 (중복 ID 처리용)
    const lines = content.split('\n');
    
    const result = lines.reduce<{ headings: HeadingItem[]; inCodeBlock: boolean }>((acc, line) => {
      // 코드 블럭 진입/이탈 체크 (```)
      if (line.trim().startsWith('```')) {
        return {
          ...acc,
          inCodeBlock: !acc.inCodeBlock,
        };
      }
      if (acc.inCodeBlock) return acc;

      // 헤딩 매칭 (# 1~3개)
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].replace(/(\*\*|__)/g, '').trim(); // 볼드체 마크다운 제거
        
        // 🛠️ 핵심: github-slugger로 ID 생성 (한글, 띄어쓰기 등 완벽 호환)
        const slug = slugger.slug(text);

        return {
          ...acc,
          headings: [...acc.headings, { text, level, slug }],
        };
      }
      return acc;
    }, { headings: [], inCodeBlock: false });

    return result.headings;
  }, [content]);

  // 2. 스크롤 감지 (IntersectionObserver)
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      // 상단 헤더 공간 등을 고려하여 감지 영역 조정
      { rootMargin: '-10% 0px -80% 0px' } 
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.slug);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  // 3. 클릭 핸들러
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
    e.preventDefault();
    const element = document.getElementById(slug);
    
    if (element) {
      // 상단 고정 헤더 높이 여유 공간
      const headerOffset = 100; 
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // URL 해시 변경 및 상태 즉시 업데이트
      history.pushState(null, '', `#${slug}`);
      setActiveId(slug); 
    }
  };

  if (headings.length === 0) return null;

  return (
    <aside className="w-full">
      <div className="rounded-lg border border-[var(--color-line)] bg-white/65 p-4 shadow-sm backdrop-blur-xl dark:bg-white/10">
        <h4 className="mb-4 text-sm font-bold text-[var(--color-text)]">목차</h4>
        <ul className="space-y-2.5">
          {headings.map((heading, index) => (
            <li 
              key={`${heading.slug}-${index}`}
              className={clsx(
                "border-l-2 pl-3 text-sm transition-all duration-200",
                heading.level === 3 ? "ml-3 text-xs" : "", // h3는 들여쓰기
                activeId === heading.slug 
                  ? "border-[var(--color-accent)] font-bold text-[var(--color-accent)]" 
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              <a 
                href={`#${heading.slug}`} 
                onClick={(e) => handleClick(e, heading.slug)}
                className="block truncate leading-snug"
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
