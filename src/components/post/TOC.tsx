'use client';

import { useEffect, useState } from 'react';
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
  const [headings, setHeadings] = useState<HeadingItem[]>([]);

  // 1. 마크다운에서 헤딩(#) 추출 및 Slug 생성
  useEffect(() => {
    const slugger = new GithubSlugger(); // Slugger 인스턴스 (중복 ID 처리용)
    const lines = content.split('\n');
    
    // 코드 블럭 내의 #은 무시
    let inCodeBlock = false;

    const matches = lines.reduce<HeadingItem[]>((acc, line) => {
      // 코드 블럭 진입/이탈 체크 (```)
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        return acc;
      }
      if (inCodeBlock) return acc;

      // 헤딩 매칭 (# 1~3개)
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].replace(/(\*\*|__)/g, '').trim(); // 볼드체 마크다운 제거
        
        // 🛠️ 핵심: github-slugger로 ID 생성 (한글, 띄어쓰기 등 완벽 호환)
        const slug = slugger.slug(text);

        acc.push({ text, level, slug });
      }
      return acc;
    }, []);

    setHeadings(matches);
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
      <div className="border-l-2 border-gray-100 pl-4 py-2">
        <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider text-opacity-80">On this page</h4>
        <ul className="space-y-2.5">
          {headings.map((heading, index) => (
            <li 
              key={`${heading.slug}-${index}`}
              className={clsx(
                "text-sm transition-all duration-200",
                heading.level === 3 ? "pl-4 text-xs" : "", // h3는 들여쓰기
                activeId === heading.slug 
                  ? "text-blue-600 font-bold translate-x-1" 
                  : "text-gray-500 hover:text-gray-900"
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