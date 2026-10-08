import test from 'node:test';
import assert from 'node:assert/strict';
import { getPageSeo, renderSeoHtml } from '../frontend/src/seo/metadata.js';

test('removing SEO tags cannot join fragments into executable script tags', () => {
  for (const removed of ['<title>old</title>', '<meta data-seo name="description" content="old">', '<script data-seo>old</script>']) {
    const html = `<html><head><scr${removed}ipt>alert("attack")</script></head><body></body></html>`;
    const output = renderSeoHtml(html, getPageSeo('/'));
    assert.doesNotMatch(output, /<script>\s*alert/);
    assert.match(output, /<scr ipt>/);
  }
});

test('SEO replacement preserves normal app scripts and escapes metadata', () => {
  const html = '<html><head><title>old title</title><meta data-seo content="old"><script data-seo>old</script><script type="module" src="/app.js"></script></head></html>';
  const seo = { ...getPageSeo('/'), title: '<img src=x onerror=alert(1)>' };
  const output = renderSeoHtml(html, seo);
  assert.equal((output.match(/<title>/g) || []).length, 1);
  assert.match(output, /<title>&lt;img src=x onerror=alert\(1\)&gt;<\/title>/);
  assert.ok(output.includes('<script type="module" src="/app.js"></script>'));
  assert.ok(output.includes('type="application/ld+json"'));
  assert.ok(!output.includes('old title'));
});
