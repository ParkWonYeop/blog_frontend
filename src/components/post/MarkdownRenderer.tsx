'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// 🛠️ 보안 패치: rehype-sanitize 추가 (반드시 npm install rehype-sanitize 실행 필요)
import rehypeSanitize from 'rehype-sanitize'; 
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Terminal, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // 🛡️ 중요: 여기서 HTML 태그를 소독하여 XSS 공격 방지
        rehypePlugins={[rehypeSanitize]} 
        components={{
          // 1. 코드 블록 커스텀 (Mac 스타일 윈도우 + 문법 강조)
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && match) {
              return (
                <CodeBlock language={language} code={codeString} />
              );
            }

            return (
              <code 
                className="bg-gray-100 text-red-500 px-1.5 py-0.5 rounded-md text-[0.9em] font-mono font-medium mx-1 break-words" 
                {...props}
              >
                {children}
              </code>
            );
          },

          // 2. 인용구 (Blockquote) 스타일
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-blue-500 bg-blue-50 pl-4 py-3 my-6 text-gray-700 rounded-r-lg italic shadow-sm">
                {children}
              </blockquote>
            );
          },

          // 3. 링크 (a) 스타일
          a({ href, children }) {
            const isExternal = href?.startsWith('http');
            return (
              <a 
                href={href} 
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="text-blue-600 hover:text-blue-800 font-medium underline-offset-4 hover:underline inline-flex items-center gap-0.5 transition-colors"
              >
                {children}
                {isExternal && <ExternalLink size={12} className="opacity-70" />}
              </a>
            );
          },

          // 4. 테이블 스타일
          table({ children }) {
            return (
              <div className="overflow-x-auto my-8 rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full text-sm text-left text-gray-700 bg-white">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">{children}</thead>;
          },
          th({ children }) {
            return <th className="px-6 py-3 font-bold text-gray-900">{children}</th>;
          },
          td({ children }) {
            return <td className="px-6 py-4 border-b border-gray-100 whitespace-pre-wrap">{children}</td>;
          },

          // 5. 이미지 스타일
          img({ src, alt }) {
            // rehype-sanitize가 적용되면 기본적으로 img 태그가 허용되지만,
            // onError 핸들링 등을 위해 커스텀 컴포넌트 유지는 좋음.
            return (
              <span className="block my-8">
                <img 
                  src={src} 
                  alt={alt} 
                  className="rounded-xl shadow-lg border border-gray-100 w-full object-cover max-h-[600px] hover:scale-[1.01] transition-transform duration-300" 
                  loading="lazy"
                  onError={(e) => {
                    // 이미지 로드 실패 시 숨김 처리 혹은 플레이스홀더
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {alt && <span className="block text-center text-sm text-gray-400 mt-2">{alt}</span>}
              </span>
            );
          },

          // 6. 리스트 스타일
          ul({ children }) {
            return <ul className="list-disc pl-6 space-y-2 my-4 text-gray-700 marker:text-gray-400">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-6 space-y-2 my-4 text-gray-700 marker:text-gray-500 font-medium">{children}</ol>;
          },
          li({ children }) {
            return <li className="pl-1">{children}</li>;
          },

          // 7. 헤딩 스타일
          h1({ children }) {
            return <h1 className="text-3xl font-extrabold mt-12 mb-6 pb-4 border-b border-gray-100 text-gray-900">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-2xl font-bold mt-10 mb-5 pb-2 text-gray-800">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-xl font-bold mt-8 mb-4 text-gray-800 flex items-center gap-2 before:content-[''] before:w-1.5 before:h-6 before:bg-blue-500 before:rounded-full before:mr-1">{children}</h3>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// 코드 블록 컴포넌트 (변경 없음)
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="relative my-8 group rounded-xl overflow-hidden border border-gray-700/50 shadow-2xl bg-[#1e1e1e]">
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
          <span>{isCopied ? 'Copied!' : 'Copy'}</span>
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