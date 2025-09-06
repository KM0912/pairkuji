# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**pairkuji** は、ダブルス練習試合の組み合わせ管理を行うPWA（Progressive Web Application）です。試合回数の偏りを最小化し、重複するペアや対戦を避けて公平な組み合わせを生成することに特化しています。

### 主要機能

- IndexedDBを使用したオフライン対応PWA
- 試合回数偏りを最小化する公平性アルゴリズム
- 主催者向けモバイル最適化カードUI

## 技術スタック

- **フレームワーク**: Next.js (App Router) + TypeScript
- **スタイリング**: Tailwind CSS
- **状態管理**: Zustand
- **データベース**: IndexedDB via Dexie
- **PWA**: Service Worker (Workbox採用予定)

## 開発コマンド

標準的なNext.jsコマンド:

```bash
npm run dev          # 開発サーバー
npm run build        # 本番ビルド
npm run start        # 本番サーバー起動
npm run lint         # ESLint実行
npm run type-check   # TypeScript型チェック
```

## アプリケーション構成

### ルート構造

- `/` - トップページ（新規練習開始/前回の続き）
- `/members` - 選手マスター管理
- `/practice` - 練習設定・参加者選択
- `/practice/round/:n` - ラウンド進行（カードUI）

### データモデル (IndexedDB Schema)

```typescript
// 練習設定（単一練習のみ）
interface PracticeSettings {
  courts: number;
  currentRound: number; // 0 = 未開始
  startedAt: string | null;
  updatedAt: string;
}

// 選手マスター
interface Member {
  id: number; // Auto increment
  name: string;
  isActive: boolean; // アクティブ/非アクティブ
  createdAt: string;
  updatedAt: string;
}

// 練習参加者
interface PracticePlayer {
  id: number; // Auto increment
  memberId: number;
  status: 'active' | 'rest'; // 出場可/一時休憩
  createdAt: string;
}

// ラウンド
interface Round {
  roundNo: number;
  courts: CourtMatch[];
  rests: number[]; // playerIds
}

// 選手統計
interface PlayerStats {
  playerId: number;
  playedCount: number;
  restCount: number;
  consecRest: number; // 連続休憩数
  recentPartners: number[]; // 最新が末尾
  recentOpponents: number[];
}
```

### 状態管理 (Zustand ストア)

- `practiceStore` - 練習設定・選手管理・参加者管理
- `roundStore` - ラウンド生成・確定・巻き戻し
- `statsStore` - ラウンド確定時の統計更新

### コア機能: 公平性アルゴリズム

公平性アルゴリズムは以下を優先するスコア関数を最小化します:

1. **休憩バランス**: 休憩回数の分散を最小化（最高優先）
2. **試合バランス**: 出場回数の分散を最小化
3. **連続休憩ペナルティ**: 2回以上の連続休憩に強いペナルティ
4. **ペア多様性**: 最近のペア重複を回避
5. **対戦多様性**: 最近の対戦重複を回避

**スコア関数**:

```
score = 4 * Var(playedCount)
      + 4 * Var(restCount)
      + 6 * Σ max(0, consecRest[p] - 1)
      + 2 * Σ duplicatePair
      + 1 * Σ duplicateMatch
```

**生成手順**:

1. 候補者を休憩優先でソート（restCount ASC, playedCount DESC）
2. 複数のランダム配置を試行（約200回）
3. 最近のペア重複を避けつつペア生成
4. 最近の対戦重複を避けつつ対戦組み合わせ
5. 最小スコアの配置を選択

### コンポーネント構成

```
/components
├─ NewPracticeForm.tsx     # 新規練習開始フォーム
├─ PracticeStatus.tsx      # 練習ステータス・継続/リセット
├─ PracticeSettings.tsx    # 練習設定（コート数等）
├─ PracticePlayerSelection.tsx # 参加者選択
├─ CourtCard.tsx           # コート表示＋入替・休憩操作
├─ RestPanel.tsx           # 休憩者一覧
├─ RoundControls.tsx       # 確定・戻す・再作成
├─ MemberManagement.tsx    # 選手マスター管理
└─ ui/                     # 基底UIコンポーネント
```

### PWA機能

- Service Workerによるオフライン対応
- IndexedDBへの自動保存
- ホーム画面インストール対応
- アプリ再起動時の練習状態復元

### パフォーマンス要件

- ラウンド生成: 40名・5コートで1秒以内
- 初回ロード: 1秒未満（PWAキャッシュ後）
- UI反応: 100ms以内

### エッジケース処理

- 人数不足: 休憩少ない参加者を試合に優先配置
- 人数過剰: 休憩多い参加者を休憩に配置
- ラウンド中離脱: カード操作で休憩へ移動・補充
- 途中参加: status='active'に変更、次ラウンドで優先配置

### データ永続化

- 練習データはIndexedDBに自動保存
- 新しい練習開始時は既存データを削除（履歴管理不要）

### 開発時の注意点

- 日本語優先UI、アクセシビリティ対応
- 体育館での視認性を考慮した大きめ文字サイズ
- 端末クラッシュ対策の自動保存機能
- 全状態変更でupdatedAtタイムスタンプ更新
- シンプルな単一練習モデル（セッション管理不要）

### 受け入れ条件（MVP）

1. 参加者8〜24名、コート2〜6面で実運用可能
2. ラウンド生成が1秒以内で完了
3. 画面を閉じても再起動で状態復帰可能
4. 途中参加者追加の次ラウンドで休憩偏り是正
5. 連続休憩2回以上が全体の5%以下
6. シンプルな操作フロー（複雑な設定不要）

## Next.js ベストプラクティス

### ディレクトリ構成

```
src/
├── app/                        # App Router
│   ├── globals.css            # グローバルスタイル
│   ├── layout.tsx             # ルートレイアウト
│   ├── page.tsx              # トップページ
│   ├── members/
│   │   └── page.tsx          # 選手マスター管理
│   ├── practice/
│   │   ├── page.tsx          # 練習設定・参加者選択
│   │   └── round/
│   │       └── [n]/
│   │           └── page.tsx  # ラウンド進行
│   └── api/                   # API Routes (将来用)
├── components/                # 再利用可能コンポーネント
│   ├── ui/                   # 基底UIコンポーネント
│   └── *.tsx                 # 機能コンポーネント
├── lib/                      # ユーティリティ・設定
│   ├── db.ts                # Dexie設定
│   ├── stores/              # Zustand stores
│   └── utils.ts             # 共通関数
├── hooks/                   # カスタムフック
├── types/                   # TypeScript型定義
└── constants/               # 定数定義
```

### パフォーマンス最適化

- **コンポーネント最適化**: React.memo()で不要な再レンダリング防止
- **状態管理**: Zustandの適切な粒度での状態分割
- **Dynamic Import**: 重いコンポーネントの遅延読み込み
- **Image最適化**: next/imageの活用（プロフィール画像等）
- **Bundle分析**: @next/bundle-analyzerでサイズ監視

### TypeScript活用

- **厳密な型定義**: strictモード有効、noUncheckedIndexedAccess設定
- **型ガード**: 実行時型チェック関数の実装
- **Utility Types**: Pick, Omit, Partialの積極活用
- **Branded Types**: IDの型安全性確保

### エラーハンドリング

- **Error Boundary**: React 18のerror.tsxファイル活用
- **非同期エラー**: try-catchとZustandでのエラー状態管理
- **PWAエラー**: Service Workerの更新失敗等の対応
- **Graceful Degradation**: オフライン時の機能制限

### PWA最適化

- **Service Worker**: Workboxでキャッシュ戦略実装
- **Manifest**: アプリ名、アイコン、テーマカラー設定
- **Performance**: Lighthouse PWAスコア90+維持
- **Offline Strategy**: Cache First for static assets, Network First for data

### セキュリティ

- **CSP設定**: Content Security Policy headers
- **XSS対策**: DOMPurifyによるサニタイゼーション（将来のリッチテキスト対応時）
- **CSRF**: SameSite cookieとCSRF token（将来のサーバー同期時）
- **入力検証**: Zodスキーマでの厳密なバリデーション

### テスト戦略

- **単体テスト**: Vitest + Testing Library
- **結合テスト**: 公平性アルゴリズムの確率的テスト
- **E2Eテスト**: Playwright（オフライン復元等）
- **PWAテスト**: Service Worker動作確認

### 開発効率化

- **ESLint**: @next/eslint-config-nextとカスタムルール
- **Prettier**: コードフォーマット統一
- **Husky**: pre-commitフックでlint/test実行
- **型チェック**: CI/CDでのtsc --noEmit確認
