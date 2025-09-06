# PWA基本設定実装

## 作業内容
Progressive Web Applicationの基本設定とManifest実装

## 実装ファイル
- `public/manifest.json`
- `src/app/layout.tsx` - manifest設定
- `public/icons/` - PWA用アイコン
- `next.config.mjs` - PWA設定

## manifest.jsonの実装
```json
{
  "name": "pairkuji - ダブルス練習組み合わせ管理",
  "short_name": "pairkuji",
  "description": "ダブルス練習試合の組み合わせ管理PWA",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png", 
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

## 必要なアイコンサイズ
- 192x192px (Android)
- 512x512px (Android)
- 180x180px (iOS)
- 32x32px (favicon)
- 16x16px (favicon)

## layout.tsxへの設定追加
```tsx
export const metadata = {
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'pairkuji'
  },
  themeColor: '#3b82f6'
};
```

## チェックリスト
- [ ] `public/manifest.json` 作成
- [ ] PWA用アイコン作成・配置
- [ ] `src/app/layout.tsx` にmanifest設定追加
- [ ] favicon設定
- [ ] PWA基本動作確認
- [ ] デベロッパーツールでのPWA確認
- [ ] ホーム画面追加機能テスト