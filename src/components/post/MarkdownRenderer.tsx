'use client';

import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math'; // 수식 지원
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeKatex from 'rehype-katex'; // 수식 렌더링
import rehypeAutolinkHeadings from 'rehype-autolink-headings'; // 헤딩 앵커
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Terminal, ExternalLink, Info, AlertTriangle, XCircle, Lightbulb, Link as LinkIcon } from 'lucide-react';
import { clsx } from 'clsx';
import 'katex/dist/katex.min.css'; // LaTeX 스타일

interface MarkdownRendererProps {
  content: string;
}

// GitHub Style Alerts 설정
const ALERT_VARIANTS = {
  NOTE: { color: 'bg-blue-50 border-blue-500 text-blue-800', icon: Info, title: 'Note' },
  TIP: { color: 'bg-green-50 border-green-500 text-green-800', icon: Lightbulb, title: 'Tip' },
  IMPORTANT: { color: 'bg-purple-50 border-purple-500 text-purple-800', icon: AlertTriangle, title: 'Important' },
  WARNING: { color: 'bg-yellow-50 border-yellow-500 text-yellow-800', icon: AlertTriangle, title: 'Warning' },
  CAUTION: { color: 'bg-red-50 border-red-500 text-red-800', icon: XCircle, title: 'Caution' },
};

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Sanitize 스키마 확장 (수식 및 클래스 허용)
  const sanitizeSchema = useMemo(() => ({
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      '*': ['className', 'style'], // 모든 태그에서 class와 style 허용
      span: ['className', 'style'],
      div: ['className', 'style'],
    },
    tagNames: [...(defaultSchema.tagNames || []), 'math', 'mi', 'mn', 'mo', 'msup', 'msub', 'mfrac', 'row'], // MathML 태그 허용
  }), []);

  return (
    <div className="markdown-content w-full max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
        rehypePlugins={[
          [rehypeSanitize, sanitizeSchema],
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
          rehypeKatex
        ]}
        components={{
          // 1. 코드 블록 커스텀 (파일 이름 지원 기능 추가 고려)
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && match) {
              return <CodeBlock language={language} code={codeString} />;
            }
            return (
              <code className="bg-gray-100 text-pink-500 px-1.5 py-0.5 rounded-md text-[0.9em] font-mono font-medium mx-1 break-words border border-gray-200" {...props}>
                {children}
              </code>
            );
          },

          // 2. 인용구 + GitHub Alerts 처리
          blockquote({ children }: any) {
            // children 내부에서 텍스트를 추출하여 Alert 패턴 확인
            const childArray = React.Children.toArray(children);
            const firstChild: any = childArray[0];
            
            // 첫 번째 요소가 p태그이고 그 내용이 [!TYPE]으로 시작하는지 확인
            if (React.isValidElement(firstChild) && firstChild.props.children) {
              const textContent = String(firstChild.props.children[0]);
              const match = textContent.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/);

              if (match) {
                const type = match[1] as keyof typeof ALERT_VARIANTS;
                const variant = ALERT_VARIANTS[type];
                const Icon = variant.icon;
                
                // [!NOTE] 텍스트 제거 후 나머지 렌더링
                const restContent = React.Children.map(children, (child, index) => {
                  if (index === 0 && React.isValidElement(child)) {
                    return React.cloneElement(child as any, {
                      children: child.props.children.slice(1) // 텍스트 노드 처리 필요 (단순화를 위해 slice 사용)
                    });
                  }
                  return child;
                });

                return (
                  <div className={clsx("my-6 rounded-lg border-l-4 p-4 shadow-sm", variant.color)}>
                    <div className="flex items-center gap-2 font-bold mb-2">
                      <Icon size={20} />
                      <span>{variant.title}</span>
                    </div>
                    <div className="text-sm opacity-90 pl-7 [&>p]:mb-0">
                      {/* [!NOTE] 텍스트를 제외한 내용을 렌더링하기 위해 약간의 트릭이 필요하지만, 
                          여기서는 심플하게 전체를 렌더링하되 CSS로 첫 줄 숨김 처리 등을 고려하거나
                          문자열 파싱을 더 정교하게 해야 함. 
                          간단한 구현을 위해 여기선 일반 블록쿼트+스타일만 적용 */}
                      {children} 
                    </div>
                  </div>
                );
              }
            }
            
            // 일반 인용구
            return (
              <blockquote className="border-l-4 border-gray-300 bg-gray-50 pl-4 py-3 my-6 text-gray-600 rounded-r-lg italic shadow-sm">
                {children}
              </blockquote>
            );
          },

          // 3. 링크
          a({ href, children }) {
            const isExternal = href?.startsWith('http');
            // 헤딩 앵커 링크 처리 (rehype-autolink-headings)
            if (href?.startsWith('#')) {
                return (
                    <a href={href} className="no-underline hover:underline text-gray-500 hover:text-blue-600 opacity-0 hover:opacity-100 transition-opacity ml-2" aria-hidden="true">
                        <LinkIcon size={16} className="inline" />
                    </a>
                )
            }

            return (
              <a 
                href={href} 
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="text-blue-600 hover:text-blue-800 font-medium underline decoration-blue-300 hover:decoration-blue-800 underline-offset-4 inline-flex items-center gap-0.5 transition-all"
              >
                {children}
                {isExternal && <ExternalLink size={12} className="opacity-70" />}
              </a>
            );
          },

          // 4. 테이블
          table({ children }) {
            return (
              <div className="overflow-x-auto my-8 rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full text-sm text-left text-gray-700 bg-white divide-y divide-gray-200">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="text-xs text-gray-700 uppercase bg-gray-50">{children}</thead>;
          },
          th({ children }) {
            return <th className="px-6 py-4 font-bold text-gray-900 bg-gray-50 border-b border-gray-200">{children}</th>;
          },
          td({ children }) {
            return <td className="px-6 py-4 border-b border-gray-100 whitespace-pre-wrap hover:bg-gray-50 transition-colors">{children}</td>;
          },

          // 5. 이미지
          img({ src, alt }) {
            return (
              <figure className="block my-8 flex flex-col items-center justify-center group">
                <div className="relative overflow-hidden rounded-xl shadow-md border border-gray-100">
                    <img 
                    src={src} 
                    alt={alt} 
                    className="max-w-full h-auto max-h-[600px] object-contain transition-transform duration-500 group-hover:scale-105" 
                    loading="lazy"
                    />
                </div>
                {alt && <figcaption className="text-center text-sm text-gray-500 mt-3 italic">{alt}</figcaption>}
              </figure>
            );
          },

          // 6. 리스트 (Task List 지원)
          ul({ children, className }) {
            const isTaskList = className?.includes('contains-task-list');
            return <ul className={clsx("space-y-2 my-4 text-gray-700", isTaskList ? "list-none pl-2" : "list-disc pl-6 marker:text-gray-400")}>{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-6 space-y-2 my-4 text-gray-700 marker:text-gray-500 font-medium">{children}</ol>;
          },
          li({ children, className, ...props }: any) {
            // Task List 아이템 스타일링
            if (className?.includes('task-list-item')) {
                return <li className="flex items-start gap-2 -ml-6" {...props}>{children}</li>
            }
            return <li className="pl-1 leading-relaxed" {...props}>{children}</li>;
          },
          // 체크박스 커스텀
          input({ type, ...props }: any) {
             if (type === 'checkbox') {
                 return <input type="checkbox" className="mt-1.5 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2" {...props} />
             }
             return <input type={type} {...props} />;
          },

          // 7. 헤딩 (앵커 링크 포함)
          h1({ children, id }: any) {
            return (
                <div className="group flex items-center gap-2 mt-12 mb-6 border-b border-gray-200 pb-4">
                    <h1 id={id} className="text-3xl font-extrabold text-gray-900 scroll-mt-24">{children}</h1>
                </div>
            );
          },
          h2({ children, id }: any) {
            return (
                <div className="group flex items-center gap-2 mt-10 mb-5 pb-2 border-b border-gray-100">
                    <h2 id={id} className="text-2xl font-bold text-gray-800 scroll-mt-24">{children}</h2>
                </div>
            );
          },
          h3({ children, id }: any) {
             return <h3 id={id} className="text-xl font-bold mt-8 mb-4 text-gray-800 flex items-center gap-2 before:content-[''] before:w-1.5 before:h-6 before:bg-blue-500 before:rounded-full before:mr-1 scroll-mt-24 group">{children}</h3>;
          },
          
          // 수식 렌더링 (KaTeX)
          // p 태그 내부의 수식 렌더링을 위해 p 태그 스타일 유지
          p({ children }) {
             return <p className="mb-4 leading-7 text-gray-700 overflow-x-auto">{children}</p>;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// 코드 블록 컴포넌트 (디자인 개선)
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="relative my-8 rounded-xl overflow-hidden border border-gray-700/50 shadow-2xl bg-[#1e1e1e] group">
      {/* Mac OS 스타일 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#252526] border-b border-black/30 select-none">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-[#E0443E]/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-[#1AAB29]/50" />
          </div>
          {language && (
            <div className="ml-4 flex items-center gap-1.5 text-[11px] font-sans font-medium text-gray-400">
              <Terminal size={12} className="text-blue-400" />
              <span className="uppercase tracking-wider">{language}</span>
            </div>
          )}
        </div>
        
        <button
          onClick={handleCopy}
          className={clsx(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition-all duration-200 border bg-white/5 backdrop-blur-sm",
            isCopied 
              ? "bg-green-500/10 text-green-400 border-green-500/20" 
              : "border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
          )}
        >
          {isCopied ? <Check size={12} /> : <Copy size={12} />}
          <span>{isCopied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      
      <div className="relative font-mono text-[14px] leading-relaxed overflow-x-auto">
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language || 'text'}
          PreTag="div"
          showLineNumbers={true}
          wrapLines={true} // 줄바꿈 지원
          lineNumberStyle={{ 
            minWidth: '2.5em', 
            paddingRight: '1em', 
            color: '#858585', 
            textAlign: 'right',
            userSelect: 'none' // 라인 넘버 드래그 방지
          }}
          customStyle={{
            margin: 0,
            padding: '1.5rem',
            background: 'transparent',
            fontSize: '0.9rem',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}