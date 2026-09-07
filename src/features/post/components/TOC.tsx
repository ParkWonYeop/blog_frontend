'use client';

import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import { ChevronDown, List } from 'lucide-react';
import { clsx } from 'clsx';
import WindowSurface from '@/shared/ui/WindowSurface';

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

  return (
    <aside
      className="sticky top-3 z-20 w-full min-w-0 self-start md:top-14 xl:order-2 xl:top-16 xl:w-[220px] xl:shrink-0"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && expanded) {
          setExpanded(false);
          toggleRef.current?.focus();
        }
      }}
    >
      <WindowSurface as="div" showTrafficLights={false} className="shadow-[var(--shadow-card)]" bodyClassName="p-2 xl:p-4">
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((value) => !value)}
          className="flex min-h-11 w-full min-w-0 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-[var(--color-text)] xl:hidden"
        >
          <List size={18} className="shrink-0 text-[var(--color-accent)]" />
          목차
          <span className="min-w-0 flex-1 truncate text-left text-xs font-normal text-[var(--color-text-muted)]">
            {headings.find((heading) => heading.id === activeId)?.text}
          </span>
          <ChevronDown size={16} className={clsx('shrink-0 transition-transform motion-reduce:transition-none', expanded && 'rotate-180')} />
        </button>
        <h2 className="mb-3 hidden text-sm font-semibold text-[var(--color-text)] xl:block">목차</h2>
        <nav id={listId} aria-label="본문 목차" className={clsx('max-h-[50svh] overflow-y-auto overscroll-contain xl:block xl:max-h-[calc(100svh-10rem)]', expanded ? 'block' : 'hidden')}>
          <ul className="space-y-1 py-1">
            {headings.map((heading) => (
              <li key={heading.id}>
                <a
                  href={`#${encodeURIComponent(heading.id)}`}
                  onClick={(event) => goToHeading(event, heading.id)}
                  aria-current={activeId === heading.id ? 'location' : undefined}
                  className={clsx(
                    'flex min-h-11 items-center break-words border-l-2 py-2 pr-2 text-sm leading-5 [overflow-wrap:anywhere] xl:min-h-0',
                    heading.level >= 3 ? 'pl-6' : 'pl-3',
                    activeId === heading.id
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] font-semibold text-[var(--color-accent)]'
                      : 'border-[var(--color-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                  )}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </WindowSurface>
    </aside>
  );
}
