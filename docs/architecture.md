# 技術仕様書 (Architecture Design Document)

## テクノロジースタック

### 言語・ランタイム

| 技術 | バージョン |
|------|-----------|
| Node.js | v24.11.0 |
| TypeScript | 5.x |
| npm | 11.x |

### フレームワーク・ライブラリ

| 技術 | バージョン | 用途 | 選定理由 |
|------|-----------|------|----------|
| Next.js | 14.2.5 | フルスタックReactフレームワーク | App Router・SSG対応・PWA最適化・セキュリティヘッダー制御 |
| React | 18.x | UIライブラリ | コンポーネント指向・豊富なエコシステム |
| Zustand | 4.5.4 | クライアント状態管理 | 軽量・ボイラープレート最小・React外からもアクセス可能 |
| Dexie.js | 4.0.8 | IndexedDBラッパー | Promise API・スキーマバージョニング・トランザクション対応 |
| Tailwind CSS | 3.4.1 | ユーティリティファーストCSS | 高速スタイリング・デザイントークンとの統合・パージによる軽量化 |
| Radix UI | 1.x | ヘッドレスUIプリミティブ（Dialog, Tabs, Slot） | アクセシビリティ標準準拠・スタイル自由度 |
| Lucide React | 0.544.0 | アイコンライブラリ | Tree-shaking対応・一貫したデザイン |
| React Icons | 5.5.0 | 追加アイコンセット | 豊富なアイコンバリエーション |
| class-variance-authority | 0.7.1 | コンポーネントバリアント管理 | 型安全なスタイルバリアント定義 |
| clsx / tailwind-merge | 2.x / 3.x | クラス名合成 | 条件付きクラス・Tailwindクラスの競合解決 |
| dayjs | 1.11.12 | 日付操作 | 軽量（2KB）・Moment.js互換API |

### 開発ツール

| 技術 | バージョン | 用途 | 選定理由 |
|------|-----------|------|----------|
| Vitest | 3.2.4 | ユニットテスト | Vite互換・高速実行・TypeScriptネイティブ対応 |
| ESLint | 8.x | 静的解析 | Next.js推奨設定との統合 |
| Prettier | 3.3.3 | コードフォーマッタ | 一貫したコードスタイル |
| PostCSS | 8.4.40 | CSSトランスフォーム | Tailwind CSS・Autoprefixerのパイプライン |
| autoprefixer | 10.4.19 | ベンダープレフィックス自動付与 | ブラウザ互換性の確保 |
| tailwindcss-animate | 1.0.7 | アニメーションユーティリティ | Tailwindとの統合アニメーション |

## アーキテクチャパターン

### 全体構成: クライアントサイド完結型PWA

サーバーサイドのデータ処理を持たず、Next.jsの静的生成（SSG）でビルドしたフロントエンドがすべてのロジックをクライアント側で実行する。データはIndexedDBにローカル保存され、ネットワーク通信なしで完全動作する。

```
┌──────────────────────────────────────────────────┐
│                  ブラウザ (PWA)                     │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │  UIレイヤー (React Components)                │ │
│  │  - App Router Pages (/, /members, /practice,  │ │
│  │    /stats)                                    │ │
│  │  - UIコンポーネント (Radix UI + Tailwind)      │ │
│  │  - レイアウト (Header, BottomNavigation)       │ │
│  ├──────────────────────────────────────────────┤ │
│  │  状態管理レイヤー (Zustand Stores)             │ │
│  │  - useMemberStore: メンバーCRUD               │ │
│  │  - usePracticeStore: 練習セッション管理        │ │
│  ├──────────────────────────────────────────────┤ │
│  │  サービスレイヤー (ビジネスロジック)             │ │
│  │  - fairnessAlgorithm: 公平性アルゴリズム       │ │
│  │  - calculatePlayerStats: 統計計算             │ │
│  ├──────────────────────────────────────────────┤ │
│  │  データレイヤー (Dexie.js → IndexedDB)        │ │
│  │  - PairkujiDB: スキーマ定義・マイグレーション   │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ┌──────────────────┐                              │
│  │  Service Worker   │ ← オフラインキャッシュ       │
│  └──────────────────┘                              │
└──────────────────────────────────────────────────┘
```

### UIレイヤー
- **責務**: ユーザー入力の受付、バリデーション、結果の表示、ルーティング
- **技術**: Next.js App Router、React 18、Radix UIプリミティブ
- **許可される操作**: Zustand Storeの呼び出し
- **禁止される操作**: IndexedDBへの直接アクセス、アルゴリズムの直接呼び出し

### 状態管理レイヤー (Zustand Stores)
- **責務**: アプリケーション状態の管理、UIとデータレイヤーの仲介
- **技術**: Zustand 4.x（`create`関数でストア定義）
- **許可される操作**: データレイヤーの呼び出し、サービスレイヤーの呼び出し
- **禁止される操作**: UI描画への直接介入
- **パターン**: 各ストアがState型とActions型を分離定義し、非同期アクションでDB操作と状態更新を一括管理

### サービスレイヤー
- **責務**: 公平性アルゴリズムの実装、統計計算、データ変換
- **技術**: 純粋TypeScript関数（Reactに非依存）
- **許可される操作**: 計算処理、型変換
- **禁止される操作**: 状態管理・データ永続化への直接アクセス

### データレイヤー
- **責務**: IndexedDBへのデータ永続化・取得・マイグレーション
- **技術**: Dexie.js 4.x
- **許可される操作**: IndexedDBトランザクション、スキーマバージョニング
- **禁止される操作**: ビジネスロジックの実装

## ルーティング構成

Next.js App Routerによるファイルシステムベースルーティング:

| パス | ページ | 機能 |
|------|--------|------|
| `/` | ランディングページ | アプリ紹介・PWAインストール誘導 |
| `/members` | メンバー管理 | メンバーの追加・編集・有効/無効化・削除 |
| `/practice` | 練習セッション | セッション開始・ラウンド生成・コート管理・フルスクリーン掲示 |
| `/stats` | 統計表示 | 出場/休憩回数・ペア頻度・対戦頻度・ラウンド履歴 |

### ナビゲーション構造
- **Header**: アプリタイトル表示
- **BottomNavigation**: 主要ページへのタブナビゲーション（モバイルファーストの片手操作対応）

## データモデル

### エンティティ定義

#### Member（メンバー）
```typescript
interface Member {
  id: number;          // 自動採番（IndexedDB auto-increment）
  name: string;        // メンバー名
  isActive: boolean;   // アクティブ/非アクティブ
  createdAt: string;   // ISO 8601 作成日時
  updatedAt: string;   // ISO 8601 更新日時
}
```

#### PracticeSettings（練習設定）
```typescript
interface PracticeSettings {
  id: number;            // 固定値: 1（シングルトン）
  courts: number;        // コート数（2〜6）
  currentRound: number;  // 現在のラウンド番号（0 = 未開始）
  startedAt: string | null;
  updatedAt: string;
}
```

#### PracticePlayer（練習参加者）
```typescript
interface PracticePlayer {
  memberId: number;      // Primary Key（Member.idと対応）
  playerNumber: number;  // 選択順番号（1から開始）
  status: 'active' | 'rest';
  createdAt: string;
  playedOffset?: number; // 途中参加時の試合数補正値
}
```

#### Round（ラウンド）
```typescript
interface Round {
  roundNo: number;       // Primary Key（ラウンド番号）
  courts: CourtMatch[];  // コートごとの対戦情報
  rests: number[];       // 休憩者のmemberIdリスト
}

interface CourtMatch {
  courtNo: number;
  pairA: [number, number]; // memberIds
  pairB: [number, number]; // memberIds
}
```

#### PairStats（ペア統計）
```typescript
interface PairStats {
  sessionId?: string;
  pairs: PairRecord[];
  lastUpdated: string;
}

interface PairRecord {
  player1: number; // smaller memberId
  player2: number; // larger memberId
  count: number;
}
```

#### PlayerStats（プレイヤー統計 - インメモリ計算用）
```typescript
interface PlayerStats {
  playerId: number;
  playedCount: number;       // 出場回数
  restCount: number;         // 休憩回数
  consecRest: number;        // 最大連続休憩数
  recentPartners: number[];  // 直近ペア履歴（最大5件、末尾が最新）
  recentOpponents: number[]; // 直近対戦相手履歴（最大5件、末尾が最新）
}
```

### IndexedDBスキーマ（Dexie.js）

データベース名: `pairkuji`

| テーブル | プライマリキー | インデックス |
|----------|--------------|-------------|
| members | ++id (auto-increment) | name, isActive, createdAt, updatedAt |
| practiceSettings | id | updatedAt |
| practicePlayers | memberId | playerNumber, status, createdAt |
| rounds | roundNo | - |
| pairStats | ++id (auto-increment) | sessionId, lastUpdated |

### ER図（概念）

```
┌─────────────┐     ┌──────────────────┐
│   Member     │────→│  PracticePlayer  │
│  (id, name)  │ 1:0..1 (memberId)    │
└─────────────┘     └──────────────────┘
                           │
                           │ participates in
                           ▼
┌──────────────────┐  ┌─────────┐
│ PracticeSettings │  │  Round  │
│  (singleton)     │──│(roundNo)│
└──────────────────┘  └─────────┘
                           │
                           │ contains
                           ▼
                     ┌────────────┐
                     │ CourtMatch │
                     │ (courtNo)  │
                     └────────────┘
```

## 状態管理設計

### Zustand Store構成

#### useMemberStore
永続的なメンバー名簿を管理するストア。

| State | 型 | 説明 |
|-------|-----|------|
| members | Member[] | メンバー一覧 |
| isLoading | boolean | ロード中フラグ |
| isInitialLoad | boolean | 初回ロード完了フラグ |
| error | string \| null | エラーメッセージ |

| Action | 説明 |
|--------|------|
| load() | IndexedDBからメンバー一覧をロード |
| add(name) | 新規メンバー追加 |
| update(id, updates) | メンバー情報更新 |
| remove(id) | メンバー削除 |
| clearError() | エラー状態クリア |

#### usePracticeStore
練習セッション全体のライフサイクルを管理するストア。

| State | 型 | 説明 |
|-------|-----|------|
| settings | PracticeSettings \| null | 練習設定（null = 未開始） |
| players | PracticePlayer[] | 参加者一覧 |
| rounds | Round[] | ラウンド履歴 |
| isLoading | boolean | ロード/生成中フラグ |
| isInitialLoad | boolean | 初回ロード完了フラグ |
| error | string \| null | エラーメッセージ |

| Action | 説明 |
|--------|------|
| load() | IndexedDBから練習データ一括ロード |
| startPractice(courts, memberIds) | 新規セッション開始（既存データクリア） |
| toggleStatus(memberId) | active/rest切替 |
| generateNextRound() | 公平性アルゴリズムで次ラウンド生成 |
| resetPractice() | セッションリセット |
| addParticipant(memberId) | 途中参加（playedOffset自動計算） |
| substitutePlayer(from, to) | 最新ラウンドのプレイヤー入替 |
| updateCourts(courts) | コート数変更 |
| clearError() | エラー状態クリア |

### データフロー

```
ユーザー操作
    │
    ▼
React Component（イベントハンドラ）
    │
    ▼
Zustand Action（非同期）
    │
    ├──→ Dexie.js トランザクション（IndexedDB書き込み）
    │
    ├──→ fairnessAlgorithm（ラウンド生成時のみ）
    │
    └──→ set()（Zustand状態更新）
           │
           ▼
      React再レンダリング（自動）
```

### 状態永続化戦略

- **即座保存**: すべてのアクション内でIndexedDBへの書き込みを完了してからZustand状態を更新
- **トランザクション保証**: Dexie.jsのトランザクション機能で複数テーブルの整合性を保証（startPractice, generateNextRound, resetPractice）
- **復元**: アプリ起動時に`load()`でIndexedDBから全状態を復元

## 公平性アルゴリズム設計

### 概要

`generateFairRound()`が中核関数。3段階の最適化を順番に実行する:

1. **休憩者選定** (`selectRestPlayers`)
2. **ペア構築** (`buildPairs`)
3. **コート割当** (`buildCourtsFromPairs`)

### 休憩者選定アルゴリズム

1. **コンテキスト構築**: 全プレイヤーの出場/休憩回数、連続休憩ストリーク、直近3ラウンドの休憩者セットを集計
2. **候補絞り込み**: 出場回数が多い・休憩回数が少ない・直近休憩していないプレイヤーを優先候補として選出
3. **組合せ探索**: 候補からのすべての組合せをバックトラックで評価し、最小スコアの組合せを選択

**スコアリング要素**:

| 要素 | 重み | 目的 |
|------|------|------|
| 出場回数の分散 | 320 | 試合回数の均等化 |
| 出場回数のレンジ | 140 | 最大偏差の抑制 |
| 休憩回数の分散 | 28 | 休憩回数の均等化 |
| 休憩回数のレンジ | 18 | 休憩偏りの抑制 |
| 最少出場者を休憩にするペナルティ | 90 | 出場機会の保証 |
| 連続休憩ペナルティ | 180 * (streak-1) | 連続休憩の回避 |
| 直近と同一休憩セットペナルティ | 220 * 4 | 休憩メンバー固定化の防止 |
| 前回と同一休憩セットペナルティ | 220 | 休憩パターンの多様化 |

### ペア構築アルゴリズム

- **減衰付きペナルティ**: 直近5ラウンドのペア履歴に対し、距離に応じた減衰ペナルティを適用
  - ペアペナルティ: base=30, decay=6, min=6
- **複数試行**: 6回の試行（1回目はソート順、2回目以降はシャッフル）で最小コストのペアリングを選択
- **制限候補**: 各プレイヤーに対し上位3名の候補からランダム選択（多様性確保）

### コート割当アルゴリズム

- **対戦ペナルティ**: 直近5ラウンドの対戦履歴に対し減衰ペナルティを適用
  - 対戦ペナルティ: base=12, decay=3, min=2
- **対戦頻度ペナルティ**: 全ラウンド通算の個人間対戦回数に基づくペナルティ（weight=4）
- **バックトラック探索**: ペア対の全組合せを探索し最小コストのコート割当を決定

### 特殊ケース

- **4人1コート**: 3パターンの固定ローテーション（[1-2|3-4] → [1-3|2-4] → [1-4|2-3]）
- **途中参加**: `playedOffset`により現在の最少出場回数を初期値として補正

## PWA構成

### Web App Manifest

| 設定 | 値 |
|------|-----|
| display | standalone |
| orientation | portrait |
| theme_color | #1e293b |
| background_color | #f8fafc |
| categories | sports, utilities |
| lang | ja |

### アイコン構成

| サイズ | 用途 |
|--------|------|
| 192x192 | PWAインストールアイコン |
| 512x512 | スプラッシュスクリーン |
| 1024x1024 | maskable（適応アイコン） |

### オフライン戦略

- **静的アセット**: Next.jsビルド成果物をService Workerでキャッシュ（Cache First戦略）
- **データ**: IndexedDBに全データをローカル保存（サーバー通信なし）
- **完全オフライン動作**: 初回インストール後はネットワーク不要

## セキュリティアーキテクチャ

### HTTPセキュリティヘッダー

`next.config.mjs`で全ルートに適用:

| ヘッダー | 値 | 目的 |
|----------|-----|------|
| X-DNS-Prefetch-Control | on | DNS事前解決の有効化 |
| X-Frame-Options | SAMEORIGIN | クリックジャッキング防止 |
| X-Content-Type-Options | nosniff | MIMEスニッフィング防止 |
| Referrer-Policy | origin-when-cross-origin | リファラー情報の制限 |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | 不要なAPI権限の無効化 |

### データ保護

- **ローカルオンリー**: すべてのデータはIndexedDBにローカル保存。サーバーへのデータ送信なし
- **最小限の個人情報**: 保存する個人情報はメンバー名のみ
- **追跡・分析なし**: Google Analyticsは本番環境かつ環境変数設定時のみ（ページビューのみ）

### 入力検証

- **メンバー名**: 空文字チェック、trim処理
- **コート数**: 数値範囲チェック（2〜6）
- **参加者数**: 最低4名のバリデーション
- **TypeScript strict mode**: `strict: true`、`noUncheckedIndexedAccess: true`で型安全性を強化

## デザインシステム

### フォント

| 用途 | フォント | CSS変数 |
|------|----------|---------|
| 見出し | Barlow Condensed (400-700) | --font-barlow-condensed |
| 本文 | Barlow (300-700) | --font-barlow |

### カラーシステム

HSLベースのCSS変数によるセマンティックカラー:

| トークン | 用途 |
|----------|------|
| background / foreground | ベース背景・テキスト |
| primary | 主要アクション・強調 |
| secondary | 補助要素 |
| accent | アクセント |
| success | 成功状態 |
| warning | 警告状態 |
| destructive | 破壊的操作 |
| muted | 控えめな要素 |
| card | カード背景 |
| chart (1-5) | グラフ・統計表示 |

### タイポグラフィスケール

| トークン | サイズ | 行間 | ウェイト |
|----------|--------|------|---------|
| display | 2rem | 1.2 | 700 |
| heading | 1.5rem | 1.3 | 600 |
| title | 1.125rem | 1.4 | 600 |
| body | 1rem | 1.5 | 400 |
| caption | 0.875rem | 1.5 | 500 |
| small | 0.75rem | 1.4 | 400 |

### エレベーション（シャドウ）

3段階のシャドウレベル（shadow-1, shadow-2, shadow-3）でUI要素の奥行きを表現。

### z-indexスケール

| レイヤー | 値 |
|----------|-----|
| base | 0 |
| dropdown | 10 |
| sticky | 20 |
| overlay | 30 |
| modal | 40 |
| toast | 50 |

## パフォーマンス要件

### レスポンスタイム

| 操作 | 目標時間 | 実装方針 |
|------|---------|---------|
| ラウンド生成 | 1秒以内 | バックトラック探索の候補数制限、試行回数上限（6回） |
| 初回ロード | 1秒未満（キャッシュ後） | PWA Service Workerキャッシュ |
| UI操作応答 | 100ms以内 | Zustand同期更新、React 18 concurrent features |
| IndexedDB読み書き | 即時 | Dexie.jsバルク操作、トランザクション最適化 |

### 最適化方針

- **フォント最適化**: `next/font`による自動最適化、`display: swap`でFOUT回避
- **Tree-shaking**: Lucide Reactの個別インポートでバンドルサイズ削減
- **CSS最適化**: Tailwind CSSのパージで未使用スタイル除去
- **型付きルート**: `experimental.typedRoutes`でルーティングの型安全性を確保

### 対応規模

| パラメータ | 範囲 | 備考 |
|-----------|------|------|
| 参加者数 | 8〜24名 | 4名未満はエラー表示 |
| コート数 | 2〜6面 | 参加者数÷4を上限として自動調整 |
| ラウンド数 | 制限なし | IndexedDBの容量に依存 |

## テスト戦略

### ユニットテスト
- **フレームワーク**: Vitest 3.2.4
- **対象**: 公平性アルゴリズム（`fairnessAlgorithm.ts`）、統計計算、ユーティリティ関数
- **グローバル設定**: `vitest/globals`の型定義をtsconfig.jsonで参照
- **実行コマンド**: `npm test`（watch）、`npm run test:run`（CI）、`npm run test:ui`（UI）

### 統合テスト
- **方法**: Zustand Store + Dexie.jsの連携テスト
- **対象**: ストアアクションの一連のフロー（セッション開始→ラウンド生成→リセット）

### 静的解析
- **ESLint**: next/core-web-vitals + prettier統合
- **TypeScript**: strict mode + noUncheckedIndexedAccess
- **実行コマンド**: `npm run lint`、`npm run type-check`

## 技術的制約

### 環境要件
- **対応ブラウザ**: Chrome、Safari（最新2バージョン）
- **対応端末**: スマートフォン（iOS/Android）、タブレット
- **必須API**: IndexedDB、Service Worker、Web App Manifest
- **ネットワーク**: 初回ダウンロード後はオフライン完全対応

### パフォーマンス制約
- 休憩者選定のバックトラック探索は候補数が多い場合に計算コストが増大（候補バッファ上限で制御）
- ペア構築は6試行で打ち切り（最適解の保証なし、実用上十分な品質）
- コート割当のバックトラックはペア数が多い場合にO(n!)だが、最大6コート（12ペア）の制約下で実用的

### セキュリティ制約
- クライアントサイドのみのデータ保存のため、端末紛失時のデータ保護はブラウザ/OSのセキュリティに依存
- IndexedDBのデータは暗号化されていない（ブラウザの同一オリジンポリシーで保護）

## 依存関係管理

### プロダクション依存

| ライブラリ | 用途 | バージョン管理方針 |
|-----------|------|-------------------|
| next | フレームワーク | 固定 (14.2.5) |
| react / react-dom | UI | 範囲指定 (^18) |
| zustand | 状態管理 | 範囲指定 (^4.5.4) |
| dexie | IndexedDB | 範囲指定 (^4.0.8) |
| @radix-ui/* | UIプリミティブ | 範囲指定 (^1.x) |
| tailwind-merge | クラス合成 | 範囲指定 (^3.3.1) |
| class-variance-authority | バリアント管理 | 範囲指定 (^0.7.1) |
| lucide-react | アイコン | 範囲指定 (^0.544.0) |
| dayjs | 日付 | 範囲指定 (^1.11.12) |

### 開発依存

| ライブラリ | 用途 | バージョン管理方針 |
|-----------|------|-------------------|
| typescript | 型システム | 範囲指定 (^5) |
| vitest | テスト | 範囲指定 (^3.2.4) |
| eslint + eslint-config-next | 静的解析 | eslint ^8, next固定 (14.2.5) |
| prettier | フォーマッタ | 範囲指定 (^3.3.3) |
| tailwindcss | CSS | 範囲指定 (^3.4.1) |
| postcss / autoprefixer | CSSビルド | 範囲指定 |

## コンポーネント構成

### ディレクトリ構造

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # ルートレイアウト（メタデータ・構造化データ・GA）
│   ├── page.tsx                  # ランディングページ
│   ├── globals.css               # グローバルスタイル・CSS変数
│   ├── members/page.tsx          # メンバー管理ページ
│   ├── practice/page.tsx         # 練習セッションページ
│   └── stats/page.tsx            # 統計ページ
├── components/
│   ├── layout/
│   │   ├── Header.tsx            # ヘッダー
│   │   └── BottomNavigation.tsx  # 下部ナビゲーション
│   ├── practice/
│   │   ├── CourtManagement.tsx   # コート管理UI
│   │   ├── FullscreenDisplay.tsx # フルスクリーン掲示
│   │   ├── ParticipantManagement.tsx  # 参加者管理
│   │   ├── ParticipantSelection.tsx   # 参加者選択
│   │   ├── AddParticipantModal.tsx    # 途中参加モーダル
│   │   └── SubstitutionHint.tsx       # 入替ヒント
│   ├── stats/
│   │   ├── PairStatsPanel.tsx    # ペア頻度統計
│   │   ├── OpponentStatsPanel.tsx # 対戦頻度統計
│   │   └── RoundHistory.tsx      # ラウンド履歴
│   ├── modals/
│   │   ├── feedback/FeedbackForm.tsx  # フィードバックフォーム
│   │   └── help/HelpModal.tsx         # ヘルプモーダル
│   └── ui/                       # 共通UIコンポーネント
│       ├── button.tsx            # ボタン（CVA バリアント）
│       ├── card.tsx              # カード
│       ├── dialog.tsx            # ダイアログ（Radix UI）
│       ├── tabs.tsx              # タブ（Radix UI）
│       ├── input.tsx             # テキスト入力
│       ├── input-group.tsx       # 入力グループ
│       ├── textarea.tsx          # テキストエリア
│       ├── spinner.tsx           # ローディングスピナー
│       ├── CourtSelector.tsx     # コート数セレクター
│       ├── SelectTile.tsx        # 選択タイル
│       ├── PlayerNumber.tsx      # プレイヤー番号表示
│       └── IconBadge.tsx         # アイコンバッジ
├── lib/
│   ├── db.ts                     # Dexie.js DB定義
│   ├── fairnessAlgorithm.ts     # 公平性アルゴリズム
│   └── stores/
│       ├── memberStore.ts        # メンバーストア
│       └── practiceStore.ts      # 練習ストア
└── types/
    ├── member.ts                 # メンバー型定義
    ├── practice.ts               # 練習設定・参加者型定義
    ├── round.ts                  # ラウンド・コート型定義
    ├── stats.ts                  # 統計型定義
    └── pairs.ts                  # ペア統計型定義
```

## SEO・メタデータ

### 構造化データ（JSON-LD）
- **type**: SoftwareApplication
- **category**: SportsApplication
- **price**: 無料

### Open Graph / Twitter Card
- OGP画像: `/icon-512.png`
- ロケール: `ja_JP`
- カード種別: summary

### Apple Web App
- capable: true
- statusBarStyle: default
