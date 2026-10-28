import { describe, expect, test } from 'vitest';
import { renderServiceWorker } from '../../scripts/write-sw.mjs';

describe('renderServiceWorker', () => {
  test('ビルドIDをキャッシュ名にし、静的ファイルと履歴の退避を含む', () => {
    const source = renderServiceWorker('build-abc', [
      '/',
      '/history',
      '/_next/static/chunks/app.js',
    ]);
    expect(source).toContain("const CACHE = 'pairkuji-' + BUILD_ID");
    expect(source).toContain('build-abc');
    expect(source).toContain('/_next/static/chunks/app.js');
    expect(source).toContain('response.ok');
    expect(source).toContain('NAV_TIMEOUT_MS');
    expect(source).toContain('/history?id=');
    expect(source).toContain("request.headers.get('RSC')");
    expect(source).toContain('_rsc');
    expect(source).toContain('status: 504');
    expect(source).toContain('text/html; charset=utf-8');
    expect(source).toContain('トップへ戻る');
    expect(source).not.toContain('text/plain; charset=utf-8');
    expect(source).not.toContain("caches.match('/')");
  });
});
