# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**pairkuji** は、ダブルス練習試合の組み合わせ管理を行うPWA（Progressive Web Application）です。休憩時間の偏りを最小化し、重複するペアや対戦を避けて公平な組み合わせを生成することに特化しています。

### 主要機能
- IndexedDBを使用したオフライン対応PWA
- 休憩偏りを最小化する公平性アルゴリズム
- 通知・バイブレーション付きリアルタイムタイマー
- CSV/JSONインポート・エクスポート機能
- 主催者向けモバイル最適化カードUI

## 技術スタック

- **フレームワーク**: Next.js (App Router) + TypeScript
- **スタイリング**: Tailwind CSS
- **状態管理**: Zustand
- **データベース**: IndexedDB via Dexie
- **PWA**: Service Worker (Workbox採用予定)
- **日時処理**: dayjs
- **将来**: Supabase (リアルタイム同期用)

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
- `/` - トップページ（新規セッション/前回の続き）
- `/session/:id/setup` - 参加者・設定管理
- `/session/:id/round/:n` - ラウンド進行（カードUI）
- `/session/:id/export` - データ入出力（任意）

### データモデル (IndexedDB Schema)

```typescript
// 主要エンティティ
interface Session {
  id: string;
  title?: string;
  courts: number;
  minutesPerGame: number;
  currentRound: number; // 0 = 未開始
  createdAt: string;
  updatedAt: string;
}

interface Player {
  id: number; // Dexie auto
  sessionId: string;
  name: string;
  tags?: string[];
  status: 'active' | 'rest' | 'absent'; // 出場可/一時休憩/離脱
}

interface Round {
  sessionId: string;
  roundNo: number;
  courts: CourtMatch[];
  rests: number[]; // playerIds
}

interface PlayerStats {
  sessionId: string;
  playerId: number;
  playedCount: number;
  restCount: number;
  consecRest: number; // 連続休憩数
  recentPartners: number[]; // 最新が末尾
  recentOpponents: number[];
}
```

### 状態管理 (Zustand ストア)
- `sessionStore` - セッション管理、オートセーブ（デバウンス）
- `playerStore` - 参加者CRUD、ステータス変更
- `roundStore` - ラウンド生成・確定・巻き戻し・タイマー制御
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
├─ SessionHeader.tsx      # タイトル・タイマー・次ラウンド作成
├─ CourtCard.tsx         # コート表示＋入替・休憩操作
├─ RestPanel.tsx         # 休憩者一覧
├─ PlayerListSheet.tsx   # 出欠トグル・検索・追加
├─ RoundControls.tsx     # 確定・戻す・再作成
├─ ImportExportPanel.tsx # CSV/JSON入出力
└─ Countdown.tsx         # タイマー・通知
```

### PWA機能
- Service Workerによるオフライン対応
- IndexedDBへの500msデバウンス自動保存
- タイマーアラート用ローカル通知・バイブレーション
- ホーム画面インストール対応
- アプリ再起動時のセッション復元

### パフォーマンス要件
- ラウンド生成: 40名・5コートで1秒以内
- 初回ロード: 1秒未満（PWAキャッシュ後）
- UI反応: 100ms以内

### エッジケース処理
- 人数不足: 休憩少ない参加者を試合に優先配置
- 人数過剰: 休憩多い参加者を休憩に配置
- ラウンド中離脱: カード操作で休憩へ移動・補充
- 途中参加: status='active'に変更、次ラウンドで優先配置

### インポート・エクスポート形式
- **CSV**: 参加者名簿の一括インポート用
- **JSON**: 完全なセッションバックアップ

### 開発時の注意点
- 日本語優先UI、アクセシビリティ対応
- 体育館での視認性を考慮した大きめ文字サイズ
- 端末クラッシュ対策の自動保存機能
- 全状態変更でupdatedAtタイムスタンプ更新

### 受け入れ条件（MVP）
1. 参加者8〜24名、コート2〜6面で実運用可能
2. ラウンド生成が1秒以内で完了
3. 画面を閉じても再起動で状態復帰可能
4. 途中参加者追加の次ラウンドで休憩偏り是正
5. 連続休憩2回以上が全体の5%以下

## Next.js ベストプラクティス

### ディレクトリ構成
```
src/
├── app/                        # App Router
│   ├── globals.css            # グローバルスタイル
│   ├── layout.tsx             # ルートレイアウト
│   ├── page.tsx              # トップページ
│   ├── session/
│   │   └── [id]/
│   │       ├── setup/
│   │       │   └── page.tsx   # 参加者・設定
│   │       ├── round/
│   │       │   └── [n]/
│   │       │       └── page.tsx # ラウンド進行
│   │       └── export/
│   │           └── page.tsx   # データ入出力
│   └── api/                   # API Routes (将来用)
├── components/                # 再利用可能コンポーネント
│   ├── ui/                   # 基底UIコンポーネント
│   └── features/             # 機能別コンポーネント
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