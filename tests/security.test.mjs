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
