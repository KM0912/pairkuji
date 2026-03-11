# リポジトリ構造定義書 (Repository Structure Document)

## プロジェクト構造

```
pairkuji/
├── src/                          # ソースコード
│   ├── app/                      # Next.js App Router（ページ・ルーティング）
│   │   ├── page.tsx              # ランディングページ（/）
│   │   ├── layout.tsx            # ルートレイアウト（フォント・メタデータ・共通UI）
│   │   ├── globals.css           # グローバルCSS（CSS変数・デザイントークン）
│   │   ├── robots.ts             # robots.txt 生成
│   │   ├── sitemap.ts            # sitemap.xml 生成
│   │   ├── members/              # メンバー管理ページ
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── practice/             # 練習セッションページ
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   └── stats/                # 統計表示ページ
│   │       ├── page.tsx
│   │       └── layout.tsx
│   ├── components/               # Reactコンポーネント
│   │   ├── layout/               # レイアウト系コンポーネント
│   │   │   ├── Header.tsx
│   │   │   └── BottomNavigation.tsx
│   │   ├── ui/                   # 汎用UIコンポーネント（shadcn/ui ベース）
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── input-group.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── spinner.tsx
│   │   │   ├── IconBadge.tsx
│   │   │   ├── CourtSelector.tsx
│   │   │   ├── SelectTile.tsx
│   │   │   └── PlayerNumber.tsx
│   │   ├── practice/             # 練習セッション関連コンポーネント
│   │   │   ├── CourtManagement.tsx
│   │   │   ├── FullscreenDisplay.tsx
│   │   │   ├── ParticipantManagement.tsx
│   │   │   ├── ParticipantSelection.tsx
│   │   │   ├── AddParticipantModal.tsx
│   │   │   └── SubstitutionHint.tsx
│   │   ├── stats/                # 統計表示コンポーネント
│   │   │   ├── PairStatsPanel.tsx
│   │   │   ├── OpponentStatsPanel.tsx
│   │   │   └── RoundHistory.tsx
│   │   └── modals/               # モーダル系コンポーネント
│   │       ├── feedback/
│   │       │   └── FeedbackForm.tsx
│   │       └── help/
│   │           └── HelpModal.tsx
│   ├── lib/                      # ビジネスロジック・ユーティリティ
│   │   ├── db.ts                 # IndexedDB設定（Dexie）
│   │   ├── fairnessAlgorithm.ts  # 公平性アルゴリズム（組み合わせ生成）
│   │   ├── fairnessAlgorithm.test.ts  # アルゴリズムのユニットテスト
│   │   ├── utils.ts              # 汎用ユーティリティ（cn関数等）
│   │   └── stores/               # 状態管理ストア（Zustand）
│   │       ├── memberStore.ts    # メンバー管理ストア
│   │       └── practiceStore.ts  # 練習セッション管理ストア
│   └── types/                    # TypeScript型定義
│       ├── member.ts             # メンバー関連の型
│       ├── practice.ts           # 練習セッション関連の型
│       ├── round.ts              # ラウンド関連の型
│       ├── pairs.ts              # ペア関連の型
│       └── stats.ts              # 統計関連の型
├── public/                       # 静的アセット
│   ├── manifest.json             # PWAマニフェスト
│   ├── icon.png                  # アプリアイコン（オリジナル）
│   ├── icon-192.png              # PWAアイコン（192x192）
│   ├── icon-512.png              # PWAアイコン（512x512）
│   ├── apple-touch-icon.png      # iOSホーム画面アイコン
│   ├── favicon-16x16.png         # ファビコン（16x16）
│   ├── favicon-32x32.png         # ファビコン（32x32）
│   └── robots.txt                # クローラー制御
├── docs/                         # プロジェクトドキュメント
│   ├── product-requirements.md   # プロダクト要求定義書
│   ├── repository-structure.md   # リポジトリ構造定義書（本ドキュメント）
│   └── old/                      # 旧バージョンのドキュメント
├── __tests__/                    # テストディレクトリ（未使用）
├── tests/                        # テストディレクトリ（未使用）
├── .claude/                      # Claude Code設定
│   ├── commands/                 # スラッシュコマンド
│   ├── skills/                   # スキル定義
│   └── agents/                   # サブエージェント定義
├── .steering/                    # ステアリングファイル（作業計画・進捗管理）
├── CLAUDE.md                     # Claude Code用プロジェクト指示書
├── package.json                  # npm依存関係・スクリプト定義
├── package-lock.json             # 依存関係ロックファイル
├── tsconfig.json                 # TypeScript設定
├── next.config.mjs               # Next.js設定（セキュリティヘッダー・PWA）
├── tailwind.config.ts            # Tailwind CSS設定（デザイントークン）
├── postcss.config.mjs            # PostCSS設定
├── vitest.config.ts              # Vitestテスト設定
├── components.json               # shadcn/ui設定
├── .eslintrc.json                # ESLint設定
├── .prettierrc                   # Prettier設定
├── .gitignore                    # Git除外設定
├── .env.example                  # 環境変数テンプレート
└── .mcp.json                     # MCP（Model Context Protocol）設定
```

## ディレクトリ詳細

### src/app/ (ページ・ルーティング)

**役割**: Next.js App Routerに基づくページ定義。各ルートに対応するディレクトリを配置する。

**配置ファイル**:
- `page.tsx`: ページコンポーネント（各ルートのメインUI）
- `layout.tsx`: レイアウトコンポーネント（ページ固有のメタデータ・構造）
- `globals.css`: グローバルスタイル（ルートのみ）
- `robots.ts`, `sitemap.ts`: SEO関連のルートハンドラ

**命名規則**:
- ディレクトリ名はNext.jsルーティングに従い、kebab-caseで命名
- ファイル名はNext.jsの規約に従う（`page.tsx`, `layout.tsx`）

**ルート構成**:
| パス | ページ | 機能 |
|------|--------|------|
| `/` | ランディングページ | アプリ紹介・導線 |
| `/members` | メンバー管理 | メンバーの追加・編集・有効/無効化 |
| `/practice` | 練習セッション | コート設定・組み合わせ生成・進行管理 |
| `/stats` | 統計表示 | 出場/休憩回数・ペア/対戦頻度 |

### src/components/ (Reactコンポーネント)

**役割**: 再利用可能なReactコンポーネント。機能ドメインごとにサブディレクトリで整理する。

**サブディレクトリ構成**:

#### layout/
**役割**: アプリケーション全体のレイアウトを構成するコンポーネント
- `Header.tsx`: アプリヘッダー
- `BottomNavigation.tsx`: ボトムナビゲーション（モバイルファースト）

#### ui/
**役割**: shadcn/uiベースの汎用UIコンポーネント。アプリ全体で再利用される基本部品。
- shadcn/uiから生成されたコンポーネント（`button.tsx`, `card.tsx`, `dialog.tsx`等）はkebab-caseで命名
- プロジェクト独自の汎用コンポーネント（`CourtSelector.tsx`, `SelectTile.tsx`等）はPascalCaseで命名

#### practice/
**役割**: 練習セッション画面に特化したコンポーネント群
- コート管理、参加者管理、フルスクリーン掲示、途中参加モーダル等

#### stats/
**役割**: 統計表示画面に特化したコンポーネント群
- ペア統計、対戦統計、ラウンド履歴表示

#### modals/
**役割**: モーダル系コンポーネント。機能ごとにサブディレクトリで分離
- `feedback/`: フィードバックフォーム
- `help/`: ヘルプモーダル

**命名規則**:
- shadcn/uiコンポーネント: kebab-case（`button.tsx`, `card.tsx`）
- 独自コンポーネント: PascalCase（`CourtManagement.tsx`, `FullscreenDisplay.tsx`）
- 1コンポーネント1ファイル

**依存関係**:
- `ui/` は他のコンポーネントに依存しない（最下位の部品レイヤー）
- `layout/` は `ui/` に依存可能
- `practice/`, `stats/`, `modals/` は `ui/` に依存可能
- `practice/`, `stats/`, `modals/` 間の相互依存は禁止

### src/lib/ (ビジネスロジック・ユーティリティ)

**役割**: UIに依存しないビジネスロジック、データアクセス、ユーティリティ関数を配置する。

**配置ファイル**:
- `db.ts`: IndexedDB設定（Dexieライブラリを使用したデータベース定義・マイグレーション）
- `fairnessAlgorithm.ts`: コア機能である公平な組み合わせ生成アルゴリズム
- `utils.ts`: 汎用ユーティリティ関数（Tailwind CSSのクラス結合用`cn`関数等）

#### stores/
**役割**: Zustandによる状態管理ストア。ドメインごとにストアを分離する。
- `memberStore.ts`: メンバーのCRUD操作・状態管理
- `practiceStore.ts`: 練習セッションの状態管理・ラウンド操作

**命名規則**:
- ストアファイル: camelCase + `Store` サフィックス（`memberStore.ts`）
- ユーティリティ: camelCase（`utils.ts`）
- ドメインロジック: camelCase（`fairnessAlgorithm.ts`）

**依存関係**:
- `stores/` は `db.ts`, `fairnessAlgorithm.ts`, `types/` に依存可能
- `db.ts` は `types/` に依存可能
- `fairnessAlgorithm.ts` は `types/` に依存可能
- `lib/` 内のファイルは `components/` に依存してはならない

### src/types/ (型定義)

**役割**: アプリケーション全体で使用するTypeScript型定義を集約する。

**配置ファイル**:
- `member.ts`: メンバー関連の型（`Member`等）
- `practice.ts`: 練習セッション関連の型（`PracticeSession`等）
- `round.ts`: ラウンド関連の型（`Round`, `CourtAssignment`等）
- `pairs.ts`: ペア関連の型
- `stats.ts`: 統計関連の型

**命名規則**:
- ファイル名: camelCase、ドメイン名を単数形で命名
- 型名: PascalCase（`Member`, `PracticeSession`）
- インターフェース・型エイリアスを使用

**依存関係**:
- 他のどのディレクトリにも依存しない（最下位のレイヤー）
- `app/`, `components/`, `lib/` すべてから参照される

### public/ (静的アセット)

**役割**: Next.jsが直接配信する静的ファイル。PWA関連のアイコン・マニフェストを中心に配置する。

**配置ファイル**:
- `manifest.json`: PWAマニフェスト（アプリ名・アイコン・表示設定）
- `icon-*.png`: 各サイズのPWAアイコン
- `apple-touch-icon.png`: iOS向けアイコン
- `favicon-*.png`: ブラウザタブ用ファビコン
- `robots.txt`: クローラー制御

### docs/ (プロジェクトドキュメント)

**役割**: プロジェクト全体の「何を作るか」「どう作るか」を定義する永続的ドキュメント。

**配置ドキュメント**:
- `product-requirements.md`: プロダクト要求定義書
- `repository-structure.md`: リポジトリ構造定義書（本ドキュメント）
- `old/`: 旧バージョンのドキュメント（参考用）

**今後追加予定**:
- `functional-design.md`: 機能設計書
- `architecture.md`: アーキテクチャ設計書
- `development-guidelines.md`: 開発ガイドライン
- `glossary.md`: 用語集

## ファイル配置規則

### ソースファイル

| ファイル種別 | 配置先 | 命名規則 | 例 |
|------------|--------|---------|-----|
| ページ | `src/app/[route]/` | `page.tsx` (Next.js規約) | `src/app/members/page.tsx` |
| レイアウト | `src/app/[route]/` | `layout.tsx` (Next.js規約) | `src/app/layout.tsx` |
| shadcn/uiコンポーネント | `src/components/ui/` | kebab-case | `button.tsx`, `card.tsx` |
| 独自UIコンポーネント | `src/components/ui/` | PascalCase | `CourtSelector.tsx` |
| 機能コンポーネント | `src/components/[domain]/` | PascalCase | `CourtManagement.tsx` |
| モーダル | `src/components/modals/[feature]/` | PascalCase | `HelpModal.tsx` |
| 状態管理ストア | `src/lib/stores/` | camelCase + Store | `memberStore.ts` |
| ドメインロジック | `src/lib/` | camelCase | `fairnessAlgorithm.ts` |
| 型定義 | `src/types/` | camelCase (単数形) | `member.ts`, `round.ts` |
| ユーティリティ | `src/lib/` | camelCase | `utils.ts` |

### テストファイル

| テスト種別 | 配置先 | 命名規則 | 例 |
|-----------|--------|---------|-----|
| ユニットテスト | テスト対象と同一ディレクトリ | `[対象].test.ts` | `fairnessAlgorithm.test.ts` |

**備考**: 現在はコロケーション方式（テスト対象と同じディレクトリに配置）を採用している。`__tests__/` と `tests/` ディレクトリは存在するが未使用。

### 設定ファイル

| ファイル | 配置先 | 役割 |
|---------|--------|------|
| `tsconfig.json` | ルート | TypeScript設定（strict、パスエイリアス `@/*`） |
| `next.config.mjs` | ルート | Next.js設定（セキュリティヘッダー、型付きルート） |
| `tailwind.config.ts` | ルート | Tailwind CSS設定（デザイントークン） |
| `postcss.config.mjs` | ルート | PostCSS設定 |
| `vitest.config.ts` | ルート | Vitestテスト設定 |
| `components.json` | ルート | shadcn/ui設定（new-york スタイル） |
| `.eslintrc.json` | ルート | ESLint設定 |
| `.prettierrc` | ルート | Prettier設定 |
| `.env.example` | ルート | 環境変数テンプレート |

## 命名規則

### ディレクトリ名

- **ルーティング**: kebab-case（Next.js App Router規約に従う）
  - 例: `members/`, `practice/`, `stats/`
- **コンポーネントカテゴリ**: kebab-case
  - 例: `ui/`, `layout/`, `practice/`, `stats/`, `modals/`
- **ライブラリ**: camelCase
  - 例: `stores/`
- **機能サブディレクトリ**: kebab-case
  - 例: `feedback/`, `help/`

### ファイル名

- **ページ・レイアウト**: Next.js規約（`page.tsx`, `layout.tsx`）
- **shadcn/uiコンポーネント**: kebab-case（`button.tsx`, `card.tsx`）
- **独自コンポーネント**: PascalCase（`CourtManagement.tsx`, `FullscreenDisplay.tsx`）
- **ストア**: camelCase + `Store`サフィックス（`memberStore.ts`）
- **型定義**: camelCase、ドメイン名の単数形（`member.ts`, `round.ts`）
- **ユーティリティ・ロジック**: camelCase（`utils.ts`, `fairnessAlgorithm.ts`, `db.ts`）
- **テスト**: `[対象ファイル名].test.ts`（`fairnessAlgorithm.test.ts`）

### パスエイリアス

`@/*` が `./src/*` にマッピングされている。インポート時は絶対パスエイリアスを使用する。

```typescript
// 推奨
import { Button } from '@/components/ui/button';
import { useMemberStore } from '@/lib/stores/memberStore';
import type { Member } from '@/types/member';

// 非推奨
import { Button } from '../../../components/ui/button';
```

## 依存関係のルール

### レイヤー間の依存

```
src/app/ (ページ)
    ↓ (OK)
src/components/ (UIコンポーネント)
    ↓ (OK)
src/lib/ (ビジネスロジック・ストア)
    ↓ (OK)
src/types/ (型定義)
```

**許可される依存**:
- `app/` → `components/`, `lib/`, `types/`
- `components/` → `lib/`, `types/`, 同階層の`ui/`
- `lib/` → `types/`
- `types/` → なし（最下位レイヤー）

**禁止される依存**:
- `types/` → `lib/`, `components/`, `app/`
- `lib/` → `components/`, `app/`
- `components/` → `app/`

### コンポーネント間の依存

- `ui/` は独立した汎用部品。他のコンポーネントカテゴリに依存しない
- `practice/`, `stats/`, `modals/` は `ui/` を使用可能だが、互いに依存しない
- `layout/` は `ui/` を使用可能

## スケーリング戦略

### 機能の追加

新しい機能を追加する際の配置方針:

1. **新しいページ**: `src/app/[route]/` に `page.tsx` と `layout.tsx` を作成
2. **機能コンポーネント**: `src/components/[domain]/` に新しいディレクトリを作成
3. **状態管理**: `src/lib/stores/[domain]Store.ts` に新しいストアを作成
4. **型定義**: `src/types/[domain].ts` に新しい型ファイルを作成
5. **ドメインロジック**: `src/lib/[domain].ts` に配置

### ファイルサイズの管理

- 1ファイル: 300行以下を推奨
- 300-500行: リファクタリングを検討
- 500行以上: 分割を強く推奨

分割時は同一ディレクトリ内でサブモジュール化する:
```
src/lib/
├── fairnessAlgorithm.ts          # メインのアルゴリズム
├── fairnessAlgorithm.test.ts     # テスト
└── fairness/                     # 大規模化した場合のサブモジュール
    ├── scorer.ts
    ├── generator.ts
    └── constraints.ts
```

## 特殊ディレクトリ

### .steering/ (ステアリングファイル)

**役割**: 特定の開発作業における「今回何をするか」を定義する作業単位のドキュメント

**構造**:
```
.steering/
└── [YYYYMMDD]-[task-name]/
    ├── requirements.md      # 今回の作業の要求内容
    ├── design.md            # 変更内容の設計
    └── tasklist.md          # タスクリスト
```

**命名規則**: `20250115-add-user-profile` 形式

### .claude/ (Claude Code設定)

**役割**: Claude Codeの設定とカスタマイズ

**構造**:
```
.claude/
├── commands/                # スラッシュコマンド定義
├── skills/                  # スキル定義（タスクモード別）
└── agents/                  # サブエージェント定義
```

## 除外設定

### .gitignore

プロジェクトで除外されるファイル:
- `node_modules/` - npm依存関係
- `.next/` - Next.jsビルド出力
- `/out/`, `/build` - 本番ビルド出力
- `/coverage` - テストカバレッジ
- `.env*.local` - ローカル環境変数
- `.DS_Store` - macOSメタデータ
- `*.tsbuildinfo`, `next-env.d.ts` - TypeScript自動生成ファイル
- `.vercel` - Vercelデプロイ設定

## 技術スタック概要

| カテゴリ | 技術 | 用途 |
|---------|------|------|
| フレームワーク | Next.js 14 (App Router) | ページルーティング・SSR・PWA |
| 言語 | TypeScript 5.x (strict) | 型安全な開発 |
| UIライブラリ | React 18 | UIコンポーネント |
| スタイリング | Tailwind CSS 3.x | ユーティリティファーストCSS |
| UIコンポーネント | shadcn/ui (new-york) | 基本UIコンポーネント |
| 状態管理 | Zustand 4.x | クライアント状態管理 |
| データ永続化 | Dexie (IndexedDB) | オフラインデータ保存 |
| アイコン | Lucide React, React Icons | UIアイコン |
| 日付処理 | Day.js | 日付操作・フォーマット |
| テスト | Vitest | ユニットテスト |
| リンター | ESLint + Prettier | コード品質・フォーマット |
| パッケージ管理 | npm | 依存関係管理 |
