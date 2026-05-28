'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize'; 
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Terminal, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import rehypeSlug from 'rehype-slug';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const components: Components = {
    // 1. 코드 블록 커스텀
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const codeString = String(children).replace(/\n$/, '');

      if (match) {
        return (
          <CodeBlock language={language} code={codeString} />
        );
      }

      return (
        <code
          className="mx-1 break-words rounded-md bg-black/[0.05] px-1.5 py-0.5 font-mono text-[0.9em] font-medium text-red-600 dark:bg-white/10 dark:text-red-300"
          {...props}
        >
          {children}
        </code>
      );
    },

    // 2. 인용구
    blockquote({ children }) {
      return (
        <blockquote className="my-7 rounded-r-lg border-l-4 border-[var(--color-accent)] bg-[var(--color-accent-soft)] py-3 pl-5 pr-4 text-[var(--color-text-muted)]">
          {children}
        </blockquote>
      );
    },

    // 3. 링크
    a({ href, children }) {
      const isExternal = href?.startsWith('http');
      return (
        <a
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="inline-flex items-center gap-0.5 font-semibold text-[var(--color-accent)] underline-offset-4 transition-colors hover:underline"
        >
          {children}
          {isExternal && <ExternalLink size={12} className="opacity-70" />}
        </a>
      );
    },

    // 4. 테이블
    table({ children }) {
      return (
        <div className="my-8 overflow-x-auto rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
          <table className="w-full text-left text-sm text-[var(--color-text-muted)]">
            {children}
          </table>
        </div>
      );
    },
    thead({ children }) {
      return <thead className="border-b border-[var(--color-line)] bg-black/[0.03] text-xs text-[var(--color-text-muted)] dark:bg-white/10">{children}</thead>;
    },
    th({ children }) {
      return <th className="px-5 py-3 font-bold text-[var(--color-text)]">{children}</th>;
    },
    td({ children }) {
      return <td className="border-b border-[var(--color-line)] px-5 py-4 whitespace-pre-wrap">{children}</td>;
    },

    // 5. 이미지
    img({ src, alt }) {
      return (
        <span className="my-8 flex flex-col items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="h-auto max-h-[700px] max-w-full rounded-lg border border-[var(--color-line)] shadow-[var(--shadow-card)] transition-transform duration-150 hover:scale-[1.005]"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
          {alt && <span className="mt-3 block w-full text-center text-sm text-[var(--color-text-subtle)]">{alt}</span>}
        </span>
      );
    },

    // 6. 리스트 스타일
    ul({ children }) {
      return <ul className="my-4 list-disc space-y-2 pl-6 text-[var(--color-text-muted)] marker:text-[var(--color-text-subtle)]">{children}</ul>;
    },
    ol({ children, ...props }) {
      return (
        <ol
          className="my-4 list-decimal space-y-2 pl-6 font-medium text-[var(--color-text-muted)] marker:text-[var(--color-text-subtle)]"
          {...props}
        >
          {children}
        </ol>
      );
    },
    li({ children }) {
      return <li className="pl-1">{children}</li>;
    },

    // 7. 헤딩 스타일
    h1({ children, ...props }) {
      return <h1 className="mt-12 mb-6 border-b border-[var(--color-line)] pb-4 text-3xl font-extrabold tracking-normal text-[var(--color-text)]" {...props}>{children}</h1>;
    },
    h2({ children, ...props }) {
      return <h2 className="mt-11 mb-5 text-2xl font-bold tracking-normal text-[var(--color-text)]" {...props}>{children}</h2>;
    },
    h3({ children, ...props }) {
      return <h3 className="mt-9 mb-4 border-l-4 border-[var(--color-accent)] pl-3 text-xl font-bold tracking-normal text-[var(--color-text)]" {...props}>{children}</h3>;
    },
  };

  return (
    <div className="markdown-content">
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

// 코드 블록 컴포넌트
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="group relative my-8 overflow-hidden rounded-lg border border-gray-700/50 bg-[#1e1e1e] shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#2d2d2d] border-b border-gray-700 select-none">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
            <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
          </div>
          {language && (
            <div className="ml-4 flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium text-gray-400 bg-gray-700/50 border border-gray-600/50">
              <Terminal size={10} />
              <span className="uppercase tracking-wider">{language}</span>
            </div>
          )}
        </div>
        
        <button
          onClick={handleCopy}
          className={clsx(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-200 border",
            isCopied 
              ? "bg-green-500/10 text-green-400 border-green-500/20" 
              : "bg-gray-700/50 text-gray-400 border-transparent hover:bg-gray-600 hover:text-white"
          )}
          title="코드 복사"
        >
          {isCopied ? <Check size={12} /> : <Copy size={12} />}
          <span>{isCopied ? '복사됨' : '복사'}</span>
        </button>
      </div>
      
      <div className="relative font-mono text-[14px] leading-relaxed">
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language}
          PreTag="div"
          showLineNumbers={true}
          lineNumberStyle={{ minWidth: '2.5em', paddingRight: '1em', color: '#6e7681', textAlign: 'right' }}
          customStyle={{
            margin: 0,
            padding: '1.5rem',
            background: 'transparent',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
