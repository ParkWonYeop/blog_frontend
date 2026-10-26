'use client';

import { isValidElement, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Check, Copy, ExternalLink } from 'lucide-react';
import rehypeSlug from 'rehype-slug';

interface MarkdownRendererProps {
  content: string;
}

const muted: CSSProperties = { color: 'var(--color-text-subtle)' };
const strong: CSSProperties = { color: 'var(--color-text)', fontWeight: 700 };

// 흑백 Prism 테마
const monoTheme: Record<string, CSSProperties> = {
  'code[class*="language-"]': {
    color: 'var(--color-text)',
    background: 'none',
    fontFamily: 'var(--font-apple-mono)',
    fontSize: '0.875rem',
    lineHeight: 1.75,
    whiteSpace: 'pre',
    wordBreak: 'normal',
    tabSize: 2,
  },
  'pre[class*="language-"]': { color: 'var(--color-text)', background: 'none' },
  comment: { ...muted, fontStyle: 'italic' },
  linenumber: { color: 'var(--color-text-placeholder)', fontStyle: 'normal' },
  prolog: muted,
  doctype: muted,
  cdata: muted,
  punctuation: muted,
  operator: muted,
  keyword: strong,
  atrule: strong,
  important: strong,
  boolean: strong,
  number: strong,
  constant: strong,
  function: { fontWeight: 600 },
  'class-name': { fontWeight: 600 },
  tag: { fontWeight: 600 },
  string: { color: 'var(--color-text-muted)' },
  char: { color: 'var(--color-text-muted)' },
  'template-string': { color: 'var(--color-text-muted)' },
  'attr-value': { color: 'var(--color-text-muted)' },
  regex: { color: 'var(--color-text-muted)' },
  deleted: { textDecoration: 'line-through' },
  inserted: { textDecoration: 'underline' },
  italic: { fontStyle: 'italic' },
  bold: { fontWeight: 700 },
};

const components: Components = {
  pre({ children }) {
    if (isValidElement<{ className?: string; children?: ReactNode }>(children)) {
      const language = /language-(\w+)/.exec(children.props.className || '')?.[1] ?? '';
      return <CodeBlock language={language} code={String(children.props.children ?? '').replace(/\n$/, '')} />;
    }

    return <pre>{children}</pre>;
  },

  code({ children }) {
    return (
      <code className="rounded-md bg-[var(--color-surface)] px-1.5 py-0.5 text-[0.86em] font-medium [overflow-wrap:anywhere]">
        {children}
      </code>
    );
  },

  a({ href, children }) {
    const isExternal = href?.startsWith('http');
    return (
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
      >
        {children}
        {isExternal && <ExternalLink size={12} aria-label="새 탭에서 열림" className="ml-0.5 inline-block align-baseline opacity-50" />}
      </a>
    );
  },

  table({ children }) {
    return (
      <div className="my-8 max-w-full overflow-x-auto rounded-2xl border border-[var(--stroke-muted)]">
        <table>{children}</table>
      </div>
    );
  },

  img({ src, alt }) {
    return (
      <span className="my-8 flex flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="h-auto max-h-[700px] max-w-full rounded-2xl"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
        {alt && <span className="mt-3 block w-full text-center text-caption1 text-[var(--color-text-subtle)]">{alt}</span>}
      </span>
    );
  },
};

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="article-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize, rehypeSlug]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="my-8 max-w-full overflow-hidden rounded-2xl bg-[var(--color-surface)]">
      <div className="flex h-10 min-w-0 items-center justify-between gap-3 border-b border-[var(--stroke-subtle)] pl-4 pr-1.5 select-none">
        <span className="min-w-0 truncate text-caption1 font-semibold text-[var(--color-text-subtle)]">{language || 'text'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-caption1 font-semibold text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]"
          aria-label="코드 복사"
        >
          {isCopied ? <Check size={14} /> : <Copy size={14} />}
          <span aria-live="polite">{isCopied ? '복사됨' : '복사'}</span>
        </button>
      </div>

      <div className="max-w-full overflow-x-auto">
        <SyntaxHighlighter
          style={monoTheme}
          language={language.toLowerCase() || 'text'}
          PreTag="div"
          showLineNumbers={code.includes('\n')}
          wrapLongLines={false}
          lineNumberStyle={{ minWidth: '2.25em', paddingRight: '1.25em', textAlign: 'right' }}
          customStyle={{ margin: 0, padding: '1rem 1.25rem 1.125rem', background: 'transparent', maxWidth: '100%' }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
