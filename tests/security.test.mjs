import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const siteUrl = 'https://blog.wypark.me';
const sourcePath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/shared/lib/paths.ts');
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const compiledModule = { exports: {} };

vm.runInNewContext(compiled, {
  module: compiledModule,
  exports: compiledModule.exports,
  require: (name) => {
    assert.equal(name, '@/shared/lib/site');
    return { SITE_URL: siteUrl };
  },
  URL,
}, { filename: sourcePath });

const { getSafeRedirectPath } = compiledModule.exports;

test('login return path stays on the blog origin after URL normalization', () => {
  for (const value of ['/admin/posts?sort=recent#top', '/posts/a%20b', '/\\evil.example', '//evil.example', 'https://evil.example', '/login']) {
    const redirect = getSafeRedirectPath(value);
    assert.equal(new URL(redirect, siteUrl).origin, siteUrl, value);
  }

  assert.equal(getSafeRedirectPath('/admin/posts?sort=recent#top'), '/admin/posts?sort=recent#top');
  assert.equal(getSafeRedirectPath('/\\evil.example'), '/');
  assert.equal(getSafeRedirectPath('//evil.example'), '/');
  assert.equal(getSafeRedirectPath('https://evil.example'), '/');
  assert.equal(getSafeRedirectPath('/login'), '/');
});

test('canonical redirect keeps protocol-relative paths on the blog origin', () => {
  const proxyPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/proxy.ts');
  const proxyCode = ts.transpileModule(fs.readFileSync(proxyPath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const proxyModule = { exports: {} };

  vm.runInNewContext(proxyCode, {
    module: proxyModule,
    exports: proxyModule.exports,
    require: (name) => {
      assert.equal(name, 'next/server');
      return {
        NextResponse: {
          redirect: (url, status) => ({ url, status, headers: new Headers() }),
        },
      };
    },
    URL,
    Headers,
    crypto: { randomUUID: () => '00000000-0000-0000-0000-000000000000' },
    process: { env: { NODE_ENV: 'production', NEXT_PUBLIC_API_URL: 'https://api.wypark.me' } },
  }, { filename: proxyPath });

  const response = proxyModule.exports.proxy({
    headers: new Headers({ host: 'blog.wypark.me', 'x-forwarded-proto': 'http' }),
    nextUrl: new URL('https://blog.wypark.me//evil.example/path?q=1'),
  });

  assert.equal(response.status, 301);
  assert.equal(response.url.origin, siteUrl);
  assert.equal(response.url.pathname, '//evil.example/path');
  assert.equal(response.url.search, '?q=1');
});
