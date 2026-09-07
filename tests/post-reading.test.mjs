import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import * as icons from 'lucide-react';
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
function loadSource(relativePath, imports = {}, globals = {}) {
  const filename = path.join(root, relativePath);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: filename,
  }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(code, {
    exports: compiledModule.exports, module: compiledModule, URLSearchParams,
    require: (id) => {
      if (id === 'react/jsx-runtime') return jsxRuntime;
      if (id in imports) return imports[id];
      throw new Error(`Unexpected import: ${id}`);
    },
    ...globals,
  }, { filename });
  return compiledModule.exports;
}

const search = loadSource('src/features/post/search.ts');
const postLib = loadSource('src/features/post/lib.ts');
const pagination = loadSource('src/shared/lib/pagination.ts');
const Link = (props) => React.createElement('a', props);
const SearchPagination = loadSource('src/features/post/components/SearchPagination.tsx', {
  'next/link': Link, 'lucide-react': icons, '@/features/post/search': search,
}).default;

test('search pages accept positive integers and safely default malformed input', () => {
  for (const value of [undefined, '', '-1', '0', '1.5', 'NaN', '1e3', '2147483648']) {
    assert.equal(search.parseSearchPage(value), 1);
  }
  assert.equal(search.parseSearchPage('3'), 3);
  assert.equal(search.parseSearchPage(['2', '9']), 2);
});

test('search navigation preserves Korean, spaces, and reserved characters', () => {
  const keyword = '리액트 & C++ #검색';
  const pageTwo = new URL(search.getSearchPageHref(keyword, 2), 'https://example.test');
  assert.equal(pageTwo.searchParams.get('keyword'), keyword);
  assert.equal(pageTwo.searchParams.get('page'), '2');
  assert.equal(new URL(search.getSearchPageHref(keyword, 1), pageTwo).searchParams.has('page'), false);
});

test('pagination renders real previous/next links and disables boundary navigation', () => {
  const render = (page, totalPages = 3) => renderToStaticMarkup(React.createElement(SearchPagination, { keyword: 'React', page, totalPages }));
  assert.doesNotMatch(render(1), /rel="prev"/);
  assert.match(render(1), /href="\/\?keyword=React&amp;page=2" rel="next"/);
  assert.match(render(2), /href="\/\?keyword=React" rel="prev"/);
  assert.match(render(2), /aria-current="page"/);
  assert.doesNotMatch(render(3), /rel="next"/);
  assert.equal(render(1, 1), '');
});

function homeWithResponse(response, calls) {
  const Surface = ({ children }) => React.createElement('section', null, children);
  return loadSource('src/app/page.tsx', {
    'next/link': Link,
    'next/navigation': { redirect: (url) => { throw new Error(`REDIRECT:${url}`); } },
    'lucide-react': icons,
    '@/features/post/publicApi': { fetchPublicPosts: async (params) => { calls.push(params); return response; } },
    '@/features/post/components/SearchPagination': SearchPagination,
    '@/features/post/search': search,
    '@/shared/lib/pagination': pagination,
    '@/shared/ui/EmptyState': ({ title }) => React.createElement('p', null, title),
    '@/shared/ui/StatusBadge': Surface, '@/shared/ui/Surface': Surface, '@/shared/ui/WindowSurface': Surface,
    '@/shared/lib/dates': { formatKoreanDate: (date) => date },
    '@/features/post/lib': postLib,
    '@/shared/lib/site': { DEFAULT_DESCRIPTION: 'Test', SITE_NAME: 'Test' },
  }).default;
}

test('the server search route requests the selected zero-based backend page', async () => {
  const calls = [];
  const Home = homeWithResponse({ content: [], page: { totalPages: 3, totalElements: 45, number: 1 } }, calls);
  const html = renderToStaticMarkup(await Home({ searchParams: Promise.resolve({ keyword: '검색어', page: '2' }) }));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].keyword, '검색어');
  assert.equal(calls[0].page, 1);
  assert.equal(calls[0].size, 20);
  assert.match(html, /45건/);
  assert.match(html, /rel="next"/);
});

test('out-of-range searches redirect to the last available page or an empty first page', async () => {
  const Home = homeWithResponse({ content: [], totalPages: 3, totalElements: 45 }, []);
  await assert.rejects(() => Home({ searchParams: Promise.resolve({ keyword: 'React', page: '99' }) }), /REDIRECT:\/\?keyword=React&page=3/);
  const EmptyHome = homeWithResponse({ content: [], totalPages: 0, totalElements: 0 }, []);
  await assert.rejects(() => EmptyHome({ searchParams: Promise.resolve({ keyword: 'React', page: '2' }) }), /REDIRECT:\/\?keyword=React$/);
});

test('search failures preserve the requested URL for a full reload and show no false count', async () => {
  const Home = homeWithResponse(null, []);
  const html = renderToStaticMarkup(await Home({ searchParams: Promise.resolve({ keyword: 'React', page: '2' }) }));
  assert.match(html, /검색 결과를 불러오지 못했습니다/);
  assert.match(html, /href="\/\?keyword=React&amp;page=2"/);
  assert.doesNotMatch(html, /0건|검색 결과 페이지/);
});

test('reading progress completes at the article body end and clamps before/after it', () => {
  const progress = postLib.getReadingProgress;
  assert.equal(progress({ top: 300, height: 2000 }, 800), 0);
  assert.equal(progress({ top: -600, height: 2000 }, 800), 50);
  assert.equal(progress({ top: -1200, height: 2000 }, 800), 100);
  assert.equal(progress({ top: -3000, height: 2000 }, 800), 100);
  assert.equal(progress({ top: 600, height: 300 }, 800), 0);
  assert.equal(progress({ top: 500, height: 300 }, 800), 100);
  assert.equal(progress({ top: 0, height: 0 }, 800), 0);
});

test('progress reacts to article resizing while comment growth does not reduce it', () => {
  const effects = [];
  const values = [];
  const frames = new Map();
  const listeners = new Map();
  let frameId = 0;
  let onResize;
  let disconnected = false;
  let rect = { top: -1200, height: 2000 };
  const body = { getBoundingClientRect: () => rect };
  const document = { documentElement: { scrollHeight: 4000 } };
  const observed = [];
  const flush = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach((callback) => callback()); };
  const hook = loadSource('src/features/post/hooks/useReadingProgress.ts', {
    react: { useState: () => [0, (value) => values.push(value)], useEffect: (effect) => effects.push(effect) },
    '@/features/post/lib': postLib,
  }, {
    document,
    window: {
      innerHeight: 800,
      requestAnimationFrame: (callback) => { frames.set(++frameId, callback); return frameId; },
      cancelAnimationFrame: (id) => frames.delete(id),
      addEventListener: (name, callback) => listeners.set(name, callback),
      removeEventListener: (name) => listeners.delete(name),
    },
    ResizeObserver: class {
      constructor(callback) { onResize = callback; }
      observe(target) { observed.push(target); }
      disconnect() { disconnected = true; }
    },
  }).default;
  hook({ current: body }, 'post-one');
  const cleanup = effects[0]();
  flush();
  assert.equal(values.at(-1), 100);
  document.documentElement.scrollHeight = 10000;
  onResize(); flush();
  assert.equal(values.at(-1), 100);
  rect = { top: -1200, height: 3200 }; // A lazy image expands the article itself.
  onResize(); flush();
  assert.equal(values.at(-1), 50);
  assert.deepEqual(observed, [body, document.documentElement]);
  listeners.get('scroll')();
  cleanup();
  assert.equal(disconnected, true);
  assert.equal(listeners.size, 0);
  assert.equal(frames.size, 0);
});

test('TOC uses rendered Markdown IDs, closes before navigation, and respects keyboard focus', () => {
  const MarkdownRenderer = loadSource('src/features/post/components/MarkdownRenderer.tsx', {
    react: React, 'react-markdown': ReactMarkdown, 'remark-gfm': remarkGfm,
    'rehype-sanitize': rehypeSanitize, 'rehype-slug': rehypeSlug, 'lucide-react': icons, clsx: { clsx },
    'react-syntax-highlighter': { Prism: ({ children }) => React.createElement('pre', null, children) },
    'react-syntax-highlighter/dist/esm/styles/prism': { vscDarkPlus: {} },
  }).default;
  const content = '# 시작\n\n## 같은 제목\n\n## 같은 제목\n\n### [링크](https://example.test)와 `코드`\n\n```js\n# 코드 속 제목\n```\n';
  const html = renderToStaticMarkup(React.createElement(MarkdownRenderer, { content }));
  const headings = [...html.matchAll(/<h([1-6])\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g)].map((match, index) => ({
    id: match[2], tagName: `H${match[1]}`, textContent: match[3].replace(/<[^>]*>/g, ''),
    getBoundingClientRect: () => ({ top: index * 400 }),
    querySelector: () => null,
    scrollIntoView: () => actions.push('scroll'), focus: () => actions.push('focus'),
  }));
  assert.equal(headings.length, 4);
  assert.notEqual(headings[1].id, headings[2].id);

  const states = [], refs = [], effects = [], actions = [];
  const frames = new Map(), listeners = new Map();
  let stateIndex = 0, refIndex = 0, frameId = 0, mounted = false;
  const bodyRef = { current: { querySelectorAll: () => headings } };
  const flush = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach((callback) => callback()); };
  const TOC = loadSource('src/features/post/components/TOC.tsx', {
    react: {
      useState: (initial) => {
        const index = stateIndex++;
        if (!(index in states)) states[index] = initial;
        return [states[index], (value) => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
      },
      useRef: (initial) => { const index = refIndex++; refs[index] ??= { current: initial }; return refs[index]; },
      useId: () => 'unit-toc',
      useEffect: (effect) => { if (!mounted) effects.push(effect); },
    },
    'lucide-react': icons, clsx: { clsx }, '@/shared/ui/WindowSurface': ({ children }) => children,
  }, {
    window: {
      requestAnimationFrame: (callback) => { frames.set(++frameId, callback); return frameId; },
      cancelAnimationFrame: (id) => frames.delete(id),
      addEventListener: (name, callback) => listeners.set(name, callback),
      removeEventListener: (name) => listeners.delete(name),
      matchMedia: () => ({ matches: true }),
    },
    history: { pushState: (_state, _title, url) => actions.push(url) },
  }).default;
  const render = () => { stateIndex = 0; refIndex = 0; const element = TOC({ content, contentRef: bodyRef }); mounted = true; return element; };
  const find = (node, predicate) => {
    if (Array.isArray(node)) return node.flatMap((child) => find(child, predicate));
    if (!React.isValidElement(node)) return [];
    return [...(predicate(node) ? [node] : []), ...find(node.props.children, predicate)];
  };
  assert.equal(render(), null);
  const cleanup = effects[0](); flush();
  let tree = render();
  const links = find(tree, (node) => node.type === 'a');
  assert.deepEqual(links.map((node) => decodeURIComponent(node.props.href.slice(1))), headings.map((heading) => heading.id));
  let toggle = find(tree, (node) => node.type === 'button')[0];
  toggle.props.ref.current = { focus: () => actions.push('toggle-focus') };
  toggle.props.onClick(); tree = render();
  assert.equal(find(tree, (node) => node.type === 'button')[0].props['aria-expanded'], true);
  links[2].props.onClick({ button: 0, preventDefault() {} });
  tree = render();
  assert.equal(find(tree, (node) => node.type === 'button')[0].props['aria-expanded'], false);
  assert.equal(actions.length, 0);
  flush();
  assert.deepEqual(actions, ['scroll', 'focus', `#${encodeURIComponent(headings[2].id)}`]);
  assert.equal(headings[2].tabIndex, -1);
  toggle = find(tree, (node) => node.type === 'button')[0];
  toggle.props.onClick(); tree = render();
  tree.props.onKeyDown({ key: 'Escape' });
  assert.equal(actions.at(-1), 'toggle-focus');
  cleanup();
  assert.equal(listeners.size, 0);
  assert.equal(frames.size, 0);
});
