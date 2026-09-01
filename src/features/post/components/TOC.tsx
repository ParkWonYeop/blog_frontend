'use client';

import { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
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

  const headings = useMemo(() => {
    const slugger = new GithubSlugger();
    const lines = content.split('\n');
    
    const result = lines.reduce<{ headings: HeadingItem[]; inCodeBlock: boolean }>((acc, line) => {
      if (line.trim().startsWith('```')) {
        return {
          ...acc,
          inCodeBlock: !acc.inCodeBlock,
        };
      }
      if (acc.inCodeBlock) return acc;

      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1]?.length ?? 1;
        const text = (match[2] ?? '').replace(/(\*\*|__)/g, '').trim();
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
      { rootMargin: '-10% 0px -80% 0px' } 
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.slug);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
    e.preventDefault();
    const element = document.getElementById(slug);
    
    if (element) {
      const headerOffset = 100; 
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      history.pushState(null, '', `#${slug}`);
      setActiveId(slug); 
    }
  };

  if (headings.length === 0) return null;

  return (
    <aside className="w-full">
      <div className="border-l border-[var(--color-line)] pl-4">
        <h4 className="mb-4 text-xs font-semibold uppercase text-[var(--color-text-subtle)]">목차</h4>
        <ul className="space-y-2.5">
          {headings.map((heading, index) => (
            <li 
              key={`${heading.slug}-${index}`}
              className={clsx(
                "text-sm transition-colors duration-150",
                heading.level === 3 ? "ml-3 text-xs" : "",
                activeId === heading.slug 
                  ? "font-semibold text-[var(--color-accent)]" 
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
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
