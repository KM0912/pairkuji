'use client';

import { useEffect } from 'react';

/** 本番ビルドだけで Service Worker を登録し、アプリの画面をオフラインでも開く。 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // 登録できなくても IndexedDB 上の練習データ自体は残る
    });
  }, []);

  return null;
}
