# 開発ガイドライン (Development Guidelines)

## 開発環境セットアップ

### 必要なツール

| ツール | バージョン | インストール方法 |
|--------|-----------|-----------------|
| Node.js | v24.11.0 | `nvm install 24.11.0` |
| npm | Node.js 同梱 | - |
| Git | 最新版 | `brew install git` / OS標準 |

### セットアップ手順

```bash
# 1. リポジトリのクローン
git clone https://github.com/KM0912/pairkuji.git
cd pairkuji

# 2. 依存関係のインストール
npm install

# 3. 環境変数の設定（必要な場合）
cp .env.example .env
# .envファイルを編集（NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_GA_TRACKING_ID 等）

# 4. 開発サーバーの起動
npm run dev
```

### 利用可能なスクリプト

| コマンド | 説明 |
|----------|------|
| `npm run dev` | Next.js開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run start` | プロダクションサーバー起動 |
| `npm run lint` | ESLintによる静的解析 |
| `npm run type-check` | TypeScriptの型チェック（`tsc --noEmit`） |
| `npm test` | Vitestテストをウォッチモードで起動 |
| `npm run test:ui` | Vitest UIモードで起動 |
| `npm run test:run` | テストを一度だけ実行 |

### 推奨開発ツール

- **VSCode**: 推奨エディタ
  - ESLint拡張: 保存時に自動リント
  - Prettier拡張: 保存時に自動フォーマット
  - Tailwind CSS IntelliSense拡張: クラス名の補完

## コーディング規約

### TypeScript

#### 基本設定

本プロジェクトでは`strict: true`に加え、`noUncheckedIndexedAccess: true`を有効化している。配列やオブジェクトのインデックスアクセスは`undefined`の可能性を考慮すること。

```typescript
// tsconfig.jsonの主要設定
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "baseUrl": ".",
  "paths": { "@/*": ["./src/*"] }
}
```

#### パスエイリアス

インポートには `@/` プレフィックスを使用する。相対パスの `../../` は禁止。

```typescript
// 良い例
import { db } from '@/lib/db';
import type { Member } from '@/types/member';

// 悪い例
import { db } from '../../lib/db';
```

#### 命名規則

- **変数・関数**: camelCase（`calculatePlayerStats`, `memberMap`）
- **定数**: UPPER_SNAKE_CASE（`SETTINGS_ID`）
- **型・インターフェース**: PascalCase（`PracticePlayer`, `CourtMatch`）
- **コンポーネント**: PascalCase（`CourtManagement`, `BottomNavigation`）
- **ファイル名**:
  - コンポーネント: PascalCase（`CourtManagement.tsx`, `PlayerNumber.tsx`）
  - ライブラリ・ユーティリティ: camelCase（`fairnessAlgorithm.ts`, `utils.ts`）
  - 型定義: camelCase（`member.ts`, `practice.ts`）
  - テスト: `[対象ファイル名].test.ts`（`fairnessAlgorithm.test.ts`）
- **Boolean変数**: `is`, `has`, `should` で始める（`isActive`, `isLoading`, `isInitialLoad`）

#### 型定義のパターン

型定義は `src/types/` ディレクトリに集約する。ドメインごとにファイルを分割する。

```typescript
// src/types/member.ts
export interface Member {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Omitを使った派生型
export type NewMember = Omit<Member, 'id' | 'createdAt' | 'updatedAt'>;
```

```typescript
// src/types/practice.ts
export type PlayerStatus = 'active' | 'rest';

export interface PracticePlayer {
  memberId: number;
  playerNumber: number;
  status: PlayerStatus;
  createdAt: string;
  playedOffset?: number;
}
```

#### `type` vs `interface` の使い分け

- **`interface`**: オブジェクト型の定義に使用（`Member`, `Round`, `CourtMatch`）
- **`type`**: ユニオン型、Omit/Pick等のユーティリティ型に使用（`PlayerStatus`, `NewMember`）

#### インポート文の `type` キーワード

型のみのインポートには `import type` を使用する。

```typescript
// 良い例
import type { Member } from '@/types/member';
import type { PracticePlayer, PracticeSettings } from '@/types/practice';

// 値と型を両方使う場合
import { type Member } from '@/types/member';
```

### React / Next.js

#### App Router

本プロジェクトはNext.js 14のApp Routerを使用する。

- ルーティング: `src/app/` 配下のディレクトリ構造で定義
- レイアウト: 各ルートの `layout.tsx` で共通レイアウトを定義
- ページ: `page.tsx` でページコンテンツを定義

#### コンポーネントの設計原則

**関数コンポーネントのみ使用する。クラスコンポーネントは使わない。**

```typescript
// ページコンポーネント（src/app/*/page.tsx）
export default function MembersPage() {
  return ( ... );
}

// 共通コンポーネント（src/components/*/）
export function CourtManagement({ players, latestRound, ... }: CourtManagementProps) {
  return ( ... );
}
```

**UIコンポーネント（src/components/ui/）にはcva（class-variance-authority）パターンを採用する。**

```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center ...', // 共通スタイル
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground ...',
        destructive: 'bg-destructive text-destructive-foreground ...',
        ghost: 'hover:bg-accent/50 ...',
      },
      size: {
        default: 'h-10 px-5 py-2.5',
        sm: 'h-8 rounded-md px-3.5 text-xs',
        lg: 'h-12 rounded-lg px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```

**Propsの型定義は`interface`で明示し、コンポーネントの直前に置く。**

```typescript
interface CourtManagementProps {
  players: PracticePlayer[];
  latestRound: Round | undefined;
  memberMap: Map<number, Member>;
  substituting: number | null;
  onPlayerClick: (memberId: number) => Promise<void>;
}

export function CourtManagement({ players, latestRound, ... }: CourtManagementProps) {
  ...
}
```

**`React.forwardRef`はUI基盤コンポーネント（button, input等）にのみ使用する。**

```typescript
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    ...
  }
);
Button.displayName = 'Button';
```

#### ディレクトリ構成

```
src/
├── app/                  # Next.js App Router
│   ├── layout.tsx        # ルートレイアウト
│   ├── page.tsx          # ランディングページ
│   ├── globals.css       # グローバルCSS（CSS変数定義）
│   ├── members/          # メンバー管理ページ
│   ├── practice/         # 練習セッションページ
│   └── stats/            # 統計ページ
├── components/
│   ├── ui/               # 汎用UIコンポーネント（Button, Card, Dialog等）
│   ├── layout/           # レイアウトコンポーネント（Header, BottomNavigation）
│   ├── practice/         # 練習機能のコンポーネント
│   ├── stats/            # 統計機能のコンポーネント
│   └── modals/           # モーダルコンポーネント
├── lib/
│   ├── utils.ts          # ユーティリティ関数（cn等）
│   ├── db.ts             # Dexie DBインスタンス定義
│   ├── fairnessAlgorithm.ts  # 公平性アルゴリズム
│   └── stores/           # Zustandストア
│       ├── memberStore.ts
│       └── practiceStore.ts
└── types/                # 型定義
    ├── member.ts
    ├── practice.ts
    ├── round.ts
    ├── pairs.ts
    └── stats.ts
```

### Tailwind CSS

#### デザインシステム

本プロジェクトはCSS変数ベースのデザイントークンを使用する。色はHSL値で `globals.css` に定義し、`tailwind.config.ts` でマッピングする。

```typescript
// tailwind.config.ts で定義されたセマンティックカラー
colors: {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  primary: { DEFAULT: 'hsl(var(--primary))', foreground: '...' },
  secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: '...' },
  muted: { DEFAULT: 'hsl(var(--muted))', foreground: '...' },
  accent: { DEFAULT: 'hsl(var(--accent))', foreground: '...' },
  success: { DEFAULT: 'hsl(var(--success))', foreground: '...' },
  warning: { DEFAULT: 'hsl(var(--warning))', foreground: '...' },
  destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: '...' },
}
```

**直接の色コード指定は禁止。必ずセマンティックカラーを使用する。**

```typescript
// 良い例
<div className="bg-primary text-primary-foreground" />
<div className="bg-card border-border" />

// 悪い例
<div className="bg-blue-500 text-white" />
<div className="bg-[#1e293b]" />
```

#### フォント

- **見出し・ラベル**: `font-heading`（Barlow Condensed）
- **本文**: `font-body`（Barlow）

```typescript
<h1 className="font-heading text-display">タイトル</h1>
<p className="font-body text-body">本文テキスト</p>
```

#### タイポグラフィ

定義済みのフォントサイズクラスを使用する。

| クラス | サイズ | 用途 |
|--------|--------|------|
| `text-display` | 2rem / 700 | ページタイトル |
| `text-heading` | 1.5rem / 600 | セクション見出し |
| `text-title` | 1.125rem / 600 | カードタイトル等 |
| `text-body` | 1rem / 400 | 本文 |
| `text-caption` | 0.875rem / 500 | 補足テキスト、ラベル |
| `text-small` | 0.75rem / 400 | 注釈 |

#### エレベーション（影）

```typescript
shadow-level-1  // カード等の基本的な浮き
shadow-level-2  // ホバー時の強調
shadow-level-3  // モーダル・ドロップダウン
```

#### z-index管理

```typescript
z-base       // 0: デフォルト
z-dropdown   // 10: ドロップダウン
z-sticky     // 20: 固定ヘッダー
z-overlay    // 30: オーバーレイ
z-modal      // 40: モーダル
z-toast      // 50: トースト通知
```

#### アニメーション

```typescript
duration-fast    // 短いトランジション
duration-normal  // 通常のトランジション
duration-slow    // 長いトランジション
ease-out-expo    // 減速カーブ
ease-in-expo     // 加速カーブ
ease-spring      // バネのようなカーブ
```

#### アクセシビリティ

- 本文コントラスト比: 7.0:1以上
- ボタンテキスト: 4.5:1以上
- タップ領域: 最低44x44px（`min-h-[44px]` / `min-h-[48px]`）
- 色覚多様性配慮: 色のみで情報を伝えず、番号・アイコンを併用

#### `cn()` ユーティリティの使用

`clsx` + `tailwind-merge` のラッパー関数 `cn()` を使って、条件付きクラスの結合と重複の解決を行う。

```typescript
import { cn } from '@/lib/utils';

<button className={cn(
  'flex items-center gap-2 rounded-lg px-3 py-2.5',
  substituting === id
    ? 'bg-warning/10 border-warning ring-2 ring-warning/30'
    : 'bg-white/80 border-primary/40 hover:bg-primary/15'
)} />
```

### コードフォーマット

#### Prettier設定

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

#### ESLint設定

```json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "rules": {
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

- `var` は使用禁止（`no-var`）
- 再代入しない変数は必ず `const` を使用（`prefer-const`）
- Next.js Core Web Vitals のルールに準拠

### コメント規約

```typescript
// 良い例: なぜそうするかを説明
// キャッシュを無効化して、最新データを取得
cache.clear();

// 悪い例: 何をしているか（コードを見れば分かる）
// キャッシュをクリアする
cache.clear();
```

**関数ドキュメント**:
```typescript
/**
 * 分散を計算する
 * @param values - 計算対象の数値配列
 * @returns 分散値
 */
function calculateVariance(values: number[]): number {
  ...
}
```

### エラーハンドリング

#### ストアでのパターン

エラーは `catch` で捕捉し、`error` ステートに格納する。`unknown` 型で受けて `instanceof Error` で判定する。

```typescript
try {
  const list = await db.members.orderBy('createdAt').reverse().toArray();
  set({ members: list, isLoading: false });
} catch (e: unknown) {
  set({
    error: e instanceof Error ? e.message : 'Failed to load members',
    isLoading: false,
  });
}
```

#### UIでのエラー表示

- `error` ステートが非nullの場合、ユーザーに適切なメッセージを表示
- `clearError()` アクションで解除可能にする

## 状態管理パターン（Zustand）

### ストアの基本構造

`State` 型と `Actions` 型を分離して定義し、`create<State & Actions>` で統合する。

```typescript
import { create } from 'zustand';

type State = {
  members: Member[];
  isLoading: boolean;
  isInitialLoad: boolean;
  error: string | null;
};

type Actions = {
  load: () => Promise<void>;
  add: (name: string) => Promise<void>;
  update: (id: number, updates: Partial<Pick<Member, 'name' | 'isActive'>>) => Promise<void>;
  remove: (id: number) => Promise<void>;
  clearError: () => void;
};

export const useMemberStore = create<State & Actions>((set, get) => ({
  // 初期値
  members: [],
  isLoading: false,
  isInitialLoad: false,
  error: null,

  // アクション
  load: async () => { ... },
  add: async (name) => { ... },
  ...
}));
```

### ストアの設計方針

- **ストアはドメインごとに分割**: `memberStore`, `practiceStore`
- **非同期処理はストア内に閉じ込める**: DB操作はアクション内で完結
- **`isLoading`**: 非同期操作中のフラグ
- **`isInitialLoad`**: 初回ロード完了フラグ（ローディング表示の制御に使用）
- **楽観的更新**: DB操作成功後に `set()` でステートを直接更新（`load()` の再呼び出しを避ける）
- **トランザクション**: 複数テーブルの同時更新は `db.transaction()` でラップ

```typescript
// 楽観的更新の例
add: async (name: string) => {
  const id = await db.members.add(member as Member);
  set({ members: [{ id, ...member }, ...get().members] });  // loadせず直接更新
},
```

## データ永続化（Dexie / IndexedDB）

### DB定義

`src/lib/db.ts` で単一の `PairkujiDB` クラスとグローバルインスタンス `db` をエクスポートする。

```typescript
export class PairkujiDB extends Dexie {
  members!: Table<Member, number>;
  practiceSettings!: Table<PracticeSettings, number>;
  practicePlayers!: Table<PracticePlayer, number>;
  rounds!: Table<Round, number>;
  pairStats!: Table<PairStats, number>;

  constructor() {
    super('pairkuji');
    this.version(1).stores({
      members: '++id, name, isActive, createdAt, updatedAt',
      practicePlayers: 'memberId, playerNumber, status, createdAt',
      rounds: 'roundNo',
      ...
    });
  }
}

export const db = new PairkujiDB();
```

### スキーマ変更時の注意

- `this.version()` の番号をインクリメントして新バージョンを追加
- 既存データのマイグレーションが必要な場合は `.upgrade()` を使用
- 主キーの変更は破壊的変更のため慎重に検討

## テスト戦略

### テストフレームワーク

- **Vitest**: テストランナー・アサーション
- `globals: true` により `describe`, `test`, `expect` をインポート不要
- `environment: 'node'` で実行（ブラウザ依存のテストは除く）
- パスエイリアス `@/` はvitest.config.tsの `resolve.alias` で解決

### テスト対象の優先順位

1. **公平性アルゴリズム**（`fairnessAlgorithm.ts`）: 最重要。多数のシナリオでプロパティベースの検証を実施
2. **ストアのビジネスロジック**: DB操作を伴うアクションのテスト
3. **ユーティリティ関数**: 純粋関数のユニットテスト

### テストの書き方

**テストファイルは対象ファイルと同じディレクトリに配置する。**

```
src/lib/
├── fairnessAlgorithm.ts
└── fairnessAlgorithm.test.ts
```

**テスト構造はdescribeでグループ化し、日本語で記述する。**

```typescript
describe('試合数偏り確認テスト', () => {
  test('6人1コート: 試合数の偏りが許容範囲内', () => {
    ...
    expect(difference).toBeLessThanOrEqual(allowableDiff);
  });
});
```

**テストユーティリティ関数はテストファイルの先頭に定義する。**

```typescript
function createTestPlayers(count: number): PracticePlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    memberId: i + 1,
    playerNumber: i + 1,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
  }));
}
```

**シナリオテーブルを使ったパラメタライズドテスト。**

```typescript
const testScenarios = [
  { players: 6, courts: 1, rounds: 15, description: '6人1コート' },
  { players: 8, courts: 1, rounds: 20, description: '8人1コート' },
  ...
];

testScenarios.forEach(({ players, courts, rounds, description }) => {
  test(`${description}: 試合数の偏りが許容範囲内`, () => {
    ...
  });
});
```

### テスト実行

```bash
# ウォッチモード（開発中）
npm test

# 一度だけ実行（CI向け）
npm run test:run

# UI付きで実行（デバッグ時）
npm run test:ui
```

## Git運用ルール

### ブランチ戦略

- **`main`**: 本番環境にデプロイ可能な状態
- **`dev`**: 開発の最新状態
- **`feature/[機能名]`**: 新機能開発
- **`fix/[修正内容]`**: バグ修正
- **`refactor/[対象]`**: リファクタリング

```
main
  └─ dev
      ├─ feature/member-management
      ├─ fix/court-display
      └─ refactor/design-system
```

### コミットメッセージ規約

本プロジェクトでは以下の形式を使用する（既存のコミット履歴に基づく）。

```
<type>: <日本語の説明>
```

**Type**:
- `Add`: 新機能追加
- `Refactor`: リファクタリング
- `Fix`: バグ修正
- `Merge`: マージコミット

**例**:
```
Add ランディングページの実装
Refactor: デザインシステムを統一しBarlow フォント採用
Refactor: 型安全性向上、アクセシビリティ改善、デッドコード削除
```

### プルリクエストプロセス

**作成前のチェック**:
- [ ] `npm run lint` でESLintエラーがないこと
- [ ] `npm run type-check` で型エラーがないこと
- [ ] `npm run test:run` で全テストがパスすること
- [ ] 競合が解決されていること

**PRテンプレート**:
```markdown
## 概要
[変更内容の簡潔な説明]

## 変更理由
[なぜこの変更が必要か]

## 変更内容
- [変更点1]
- [変更点2]

## テスト
- [ ] 型チェックパス
- [ ] Lintパス
- [ ] ユニットテストパス
- [ ] 手動テスト実施

## スクリーンショット（該当する場合）
[画像]
```

## セキュリティ・プライバシー

### 基本方針

- データはすべてローカル（IndexedDB）に保存。サーバーへの送信なし
- 保存する個人情報は氏名のみ

### セキュリティヘッダー

`next.config.mjs` で以下のヘッダーを設定済み:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### 環境変数

- `NEXT_PUBLIC_` プレフィックス付きのみクライアントに公開可能
- 秘密情報は `.env` に記載し、`.gitignore` に含めること
- コード内にシークレットをハードコードしない

## PWA対応

### 基本要件

- Service Workerによるオフライン動作
- `manifest.json` によるホーム画面インストール
- 静的アセットのCache First戦略
- `next.config.mjs` の `experimental.typedRoutes: true` による型安全なルーティング

## コードレビュー基準

### レビューポイント

**機能性**:
- 要件を満たしているか
- エッジケースが考慮されているか（4名未満、24名超、0コート等）
- エラーハンドリングが適切か

**可読性**:
- 命名が明確か
- 型定義が適切か（`any` の使用は原則禁止）
- Tailwindクラスが長すぎる場合、cvaやcnで整理されているか

**保守性**:
- 重複コードがないか
- 責務が明確に分離されているか（ストア/コンポーネント/型/アルゴリズム）
- デザイントークンが適切に使用されているか（ハードコード色禁止）

**パフォーマンス**:
- 不要な再レンダリングがないか
- 大量データでのアルゴリズム実行時間が許容範囲内か（1秒以内）

**アクセシビリティ**:
- タップ領域が44px以上か
- コントラスト比が要件を満たしているか
- 色のみで情報を伝えていないか
