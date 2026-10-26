'use client';

import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

interface TOCProps {
  content: string;
  contentRef: RefObject<HTMLElement | null>;
}

interface HeadingItem {
  text: string;
  level: number;
  id: string;
}

const headingSelector = 'h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]';

export default function TOC({ content, contentRef }: TOCProps) {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activeId, setActiveId] = useState('');
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navigationFrame = useRef(0);

  useEffect(() => {
    const body = contentRef.current;
    if (!body) return;
    let frame = 0;
    // Use rendered heading IDs, including Markdown links, inline code, and duplicate titles.
    const collectFrame = window.requestAnimationFrame(() => {
      setHeadings(Array.from(body.querySelectorAll<HTMLElement>(headingSelector), (heading) => ({
        text: heading.textContent?.trim() || heading.querySelector('img')?.alt || '제목 없음',
        level: Number(heading.tagName.slice(1)),
        id: heading.id,
      })));
    });
    const updateActive = () => {
      const elements = body.querySelectorAll<HTMLElement>(headingSelector);
      let current = elements[0]?.id ?? '';
      for (const heading of elements) {
        if (heading.getBoundingClientRect().top > 160) break;
        current = heading.id;
      }
      setActiveId(current);
    };
    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateActive);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.cancelAnimationFrame(collectFrame);
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(navigationFrame.current);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [content, contentRef]);

  const goToHeading = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const heading = Array.from(contentRef.current?.querySelectorAll<HTMLElement>(headingSelector) ?? [])
      .find((element) => element.id === id);
    if (!heading) return;
    event.preventDefault();
    setExpanded(false);
    // Measure the target after collapsing the mobile menu.
    window.cancelAnimationFrame(navigationFrame.current);
    navigationFrame.current = window.requestAnimationFrame(() => {
      heading.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      history.pushState(null, '', `#${encodeURIComponent(id)}`);
      setActiveId(id);
    });
  };

  if (headings.length === 0) return null;

  const activeHeading = headings.find((heading) => heading.id === activeId);

  return (
    <aside
      className="sticky top-14 z-30 -mx-4 min-w-0 self-stretch border-b border-[var(--stroke-subtle)] bg-[var(--color-page)] px-4 md:-mx-8 md:px-8 xl:order-2 xl:top-24 xl:mx-0 xl:w-[200px] xl:shrink-0 xl:self-start xl:border-0 xl:bg-transparent xl:px-0"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && expanded) {
          setExpanded(false);
          toggleRef.current?.focus();
        }
      }}
    >
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={expanded}
        aria-controls={listId}
        onClick={() => setExpanded((value) => !value)}
        className="flex h-12 w-full min-w-0 items-center gap-3 text-left xl:hidden"
      >
        <span className="shrink-0 text-body2 font-bold text-[var(--color-text)]">목차</span>
        <span className="min-w-0 flex-1 truncate text-body2 text-[var(--color-text-subtle)]">{activeHeading?.text}</span>
        <ChevronDown size={18} className={clsx('shrink-0 text-[var(--color-text-subtle)] transition-transform', expanded && 'rotate-180')} />
      </button>
      <h2 className="mb-3 hidden text-caption1 font-semibold text-[var(--color-text-subtle)] xl:block">목차</h2>
      <nav
        id={listId}
        aria-label="본문 목차"
        className={clsx('max-h-[50svh] overflow-y-auto overscroll-contain pb-3 xl:block xl:max-h-[calc(100svh-8rem)] xl:pb-0', expanded ? 'block' : 'hidden')}
      >
        <ul>
          {headings.map((heading) => {
            const isActive = activeId === heading.id;

            return (
              <li key={heading.id}>
                <a
                  href={`#${encodeURIComponent(heading.id)}`}
                  onClick={(event) => goToHeading(event, heading.id)}
                  aria-current={isActive ? 'location' : undefined}
                  className={clsx(
                    'flex min-h-10 items-center break-words border-l-2 py-1.5 pr-2 text-body2 [overflow-wrap:anywhere] xl:min-h-0 xl:text-caption1',
                    heading.level >= 3 ? 'pl-6' : 'pl-3',
                    isActive
                      ? 'border-[var(--color-text)] font-semibold text-[var(--color-text)]'
                      : 'border-[var(--stroke-muted)] text-[var(--color-text-subtle)] hover:text-[var(--color-text)]',
                  )}
                >
                  {heading.text}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
