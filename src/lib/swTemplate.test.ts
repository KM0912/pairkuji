import { runInNewContext } from 'node:vm';
import { describe, expect, test, vi } from 'vitest';
import { renderServiceWorker } from '../../scripts/write-sw.mjs';

describe('renderServiceWorker', () => {
  test.each(['/members', '/members/'])(
    '旧URL %s は通信せず統合画面へ転送する',
    async (pathname) => {
      const handlers = new Map<string, (event: unknown) => void>();
      const fetch = vi.fn().mockRejectedValue(new Error('offline'));
      runInNewContext(renderServiceWorker('build-test', []), {
        self: {
          location: { origin: 'https://pairkuji.test' },
          addEventListener: (name: string, handler: (event: unknown) => void) =>
            handlers.set(name, handler),
        },
        fetch,
        Response,
        URL,
      });
      let responsePromise: Promise<Response> | undefined;
      handlers.get('fetch')!({
        request: {
          method: 'GET',
          mode: 'navigate',
          url: `https://pairkuji.test${pathname}`,
        },
        respondWith: (response: Promise<Response>) => {
          responsePromise = response;
        },
      });
      const response = await responsePromise;
      expect(response?.status).toBe(302);
      expect(response?.headers.get('Location')).toBe(
        'https://pairkuji.test/practice'
      );
      expect(fetch).not.toHaveBeenCalled();
    }
  );

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
    expect(source).not.toContain("caches.match('/')");
  });
});
