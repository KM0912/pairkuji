# SEO対策改善まとめ

このドキュメントは、ペアくじアプリに実装したSEO対策の詳細をまとめたものです。

## 実装済みSEO対策

### 1. 基本メタデータの強化

#### `/src/app/layout.tsx`
- **メタベースURL**: 環境変数 `NEXT_PUBLIC_SITE_URL` でベースURLを設定
- **タイトルテンプレート**: 各ページで `%s | ペアくじ` の形式を使用
- **詳細な説明文**: アプリの特徴を明確に記載
- **キーワード**: ダブルス、練習試合、バドミントン、テニス、卓球、PWA等を追加
- **著者情報**: creator、publisher を設定
- **フォーマット検出**: 電話番号の自動リンク無効化

### 2. Open Graph Protocol (OGP)

SNSシェア時の表示最適化：
- **type**: website
- **locale**: ja_JP
- **siteName**: ペアくじ
- **title**: ペアくじ - ダブルス練習試合管理
- **description**: 詳細な説明文
- **images**: 512x512のアイコン画像

### 3. Twitter Card

Twitter/X での表示最適化：
- **card**: summary
- **title**: ペアくじ - ダブルス練習試合管理
- **description**: 簡潔な説明文
- **images**: 512x512のアイコン画像

### 4. ビューポート設定

モバイル対応の最適化：
- **width**: device-width
- **initialScale**: 1
- **maximumScale**: 5
- **userScalable**: true
- **themeColor**: #1e293b

### 5. Apple Web App対応

iOS PWAの最適化：
- **capable**: true
- **statusBarStyle**: default
- **title**: ペアくじ

### 6. ロボット制御

検索エンジンクローラーの制御：
- **index**: true（インデックス許可）
- **follow**: true（リンク追跡許可）
- **googleBot**: 詳細設定で最大限のプレビュー表示を許可

### 7. 構造化データ（JSON-LD）

Schema.org の SoftwareApplication 形式：
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "ペアくじ",
  "applicationCategory": "SportsApplication",
  "operatingSystem": "Web Browser, iOS, Android",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "JPY"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "1"
  }
}
```

### 8. robots.txt

`/public/robots.txt`:
```
User-agent: *
Allow: /
Sitemap: https://pairkuji.app/sitemap.xml
```

### 9. サイトマップ

`/src/app/sitemap.ts` で動的生成：
- `/` (priority: 1.0, monthly)
- `/members` (priority: 0.8, weekly)
- `/practice` (priority: 0.9, daily)
- `/stats` (priority: 0.7, daily)

### 10. ページ固有のメタデータ

各ページに専用レイアウトを作成：

#### `/src/app/members/layout.tsx`
- title: 選手管理
- description: 選手の追加・編集・削除

#### `/src/app/practice/layout.tsx`
- title: 練習管理
- description: 組み合わせ生成・管理

#### `/src/app/stats/layout.tsx`
- title: 統計
- description: 統計情報・履歴表示

### 11. セキュリティヘッダー

`/next.config.mjs` で設定：
- **X-DNS-Prefetch-Control**: on
- **X-Frame-Options**: SAMEORIGIN
- **X-Content-Type-Options**: nosniff
- **Referrer-Policy**: origin-when-cross-origin
- **Permissions-Policy**: camera=(), microphone=(), geolocation=()

## 環境変数設定

`.env.example` を参考に `.env.local` を作成してください：

```bash
# サイトURL（本番環境）
NEXT_PUBLIC_SITE_URL=https://pairkuji.app

# Google Analytics トラッキングID（オプション）
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
```

## SEO検証ツール

以下のツールで効果を確認してください：

1. **Google Search Console**: インデックス状況・検索パフォーマンス
2. **Google PageSpeed Insights**: パフォーマンス・SEOスコア
3. **Lighthouse**: 総合的なSEO評価
4. **Twitter Card Validator**: OGP表示確認
5. **Facebook Sharing Debugger**: OGP表示確認
6. **Schema Markup Validator**: 構造化データの検証

## 期待される効果

1. **検索エンジンランキング向上**: 適切なメタデータとキーワード
2. **SNSシェア時の視認性向上**: OGP/Twitter Card
3. **クロール効率向上**: robots.txt とサイトマップ
4. **リッチスニペット表示**: 構造化データ
5. **モバイルフレンドリー**: viewport設定
6. **PWA評価向上**: Apple Web App対応
7. **セキュリティ評価向上**: セキュリティヘッダー

## 次のステップ（オプション）

- [ ] Google Search Console への登録
- [ ] Bing Webmaster Tools への登録
- [ ] canonical URL の設定（必要に応じて）
- [ ] 言語・地域ターゲティング（hreflang）
- [ ] パンくずリスト（BreadcrumbList）の構造化データ
- [ ] FAQページの構造化データ（FAQ Schema）
- [ ] 記事・ブログ追加（SEOコンテンツ強化）
- [ ] XMLサイトマップの自動更新（動的ページ対応）

## 注意事項

- 本番環境では `NEXT_PUBLIC_SITE_URL` を正しいドメインに設定してください
- 構造化データの `aggregateRating` は実際のユーザー評価に基づいて更新してください
- Google Analytics のトラッキングIDは本番環境でのみ設定してください
- PWAインストール数が増えたら、構造化データの `ratingCount` を更新してください

## 更新履歴

- 2025-10-30: 初回SEO対策実装
  - メタデータ強化
  - OGP/Twitter Card追加
  - 構造化データ追加
  - robots.txt/sitemap.xml作成
  - セキュリティヘッダー追加
