# Service Worker実装

## 作業内容
オフラインキャッシュ機能とWorkboxを使用したService Worker実装

## 実装ファイル
- `public/sw.js` - Service Workerスクリプト
- `src/lib/sw-registration.ts` - SW登録ロジック
- `workbox-config.js` - Workboxコンフィグ（将来用）

## Service Workerの実装
```javascript
// sw.js の基本構造
const CACHE_NAME = 'pairkuji-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  // 必要な静的リソース
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_CACHE_URLS))
  );
});

self.addEventListener('fetch', (event) => {
  // Cache First戦略の実装
});
```

## キャッシュ戦略
- **静的リソース**: Cache First
- **アプリシェル**: Cache First
- **データ**: Network First（IndexedDBがメイン）

## sw-registration.tsの実装
```typescript
export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered:', registration);
    } catch (error) {
      console.log('SW registration failed:', error);
    }
  }
};

export const unregisterServiceWorker = async (): Promise<void> => {};
```

## オフライン機能
- アプリシェルの完全キャッシュ
- 静的リソースのキャッシュ
- IndexedDBデータでの完全動作
- オフライン状態の表示

## チェックリスト
- [ ] `public/sw.js` 実装
- [ ] `src/lib/sw-registration.ts` 実装
- [ ] キャッシュ戦略実装
- [ ] オフライン検知機能実装
- [ ] アプリ起動時のSW登録
- [ ] SW更新時の処理実装
- [ ] オフライン動作テスト