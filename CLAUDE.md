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

### コア機能: 公平性アルゴリズム (`src/lib/fairnessAlgorithm.ts`)

ダブルス練習の組み合わせ生成において、試合回数の偏り最小化と多様性を両立する高度なアルゴリズムを実装しています。

#### 基本設計思想

1. **3段階最適化**: 休憩者選定 → ペア形成 → コート配置の順で段階的に最適化
2. **統計ベース判定**: 過去ラウンドから各選手の詳細統計を計算し、それに基づいて公平性を評価
3. **動的重み調整**: 参加者数や試合状況に応じてペナルティ重みを自動調整
4. **確率的探索**: 複数回の試行でローカル最適解を回避し、より良い組み合わせを発見

#### 定数・パラメータ

```typescript
// ペア・対戦の再登場重み付け
const MAX_RECENT_RECORDS = 5;           // 最近の履歴記録数
const PARTNER_PENALTY_BASE = 30;        // ペア重複基本ペナルティ
const PARTNER_PENALTY_DECAY = 6;        // 時間経過による減衰
const PARTNER_PENALTY_MIN = 6;          // 最小ペナルティ
const OPPONENT_PENALTY_BASE = 12;       // 対戦重複基本ペナルティ
const OPPONENT_PENALTY_DECAY = 3;       // 時間経過による減衰
const OPPONENT_PENALTY_MIN = 2;         // 最小ペナルティ

// 休憩者選定評価重み
const PLAYED_VARIANCE_WEIGHT = 320;     // 試合回数分散重み
const PLAYED_RANGE_WEIGHT = 140;        // 試合回数範囲重み
const REST_VARIANCE_WEIGHT = 28;        // 休憩回数分散重み
const REST_RANGE_WEIGHT = 18;           // 休憩回数範囲重み
const LOW_PLAYED_REST_PENALTY = 90;     // 低試合回数者休憩ペナルティ
const CONSECUTIVE_REST_PENALTY = 180;   // 連続休憩ペナルティ
const RECENT_OVERLAP_PENALTY = 36;      // 直近休憩重複ペナルティ
const OLDER_OVERLAP_PENALTY = 16;       // 過去休憩重複ペナルティ
const REPEAT_SET_PENALTY = 220;         // 同一休憩組ペナルティ
```

#### ステップ1: 統計計算 (`calculatePlayerStats`)

各選手の詳細統計を過去ラウンドから計算：

- **試合回数** (`playedCount`): 出場ラウンド数 + 途中参加補正
- **休憩回数** (`restCount`): 休憩ラウンド数
- **連続休憩** (`consecRest`): 最大連続休憩回数
- **最近のペア** (`recentPartners`): 直近5回のペア相手履歴
- **最近の対戦相手** (`recentOpponents`): 直近5回の対戦相手履歴

**途中参加補正**: 新規参加者に `playedOffset` を設定し、既存参加者との試合回数差を調整

#### ステップ2: 休憩者選定 (`selectRestPlayers`)

最も複雑で重要な段階。以下の手順で最適な休憩者を選定：

1. **候補者収集** (`collectRestCandidates`):
   - 試合回数多順 → 休憩回数少順 → 最近休憩回避順でソート
   - 上位候補 + 試合回数最多者 + 休憩回数最少者を候補プールに含める

2. **組み合わせ評価** (`scoreRestCombination`):
   ```typescript
   score = playedVariance * 320 + playedRange * 140    // 試合バランス
         + restVariance * 28 + restRange * 18          // 休憩バランス
         + lowPlayedPenalty * 90                       // 低試合者休憩回避
         + consecutiveRestPenalty * 180                // 連続休憩回避
         + recentOverlapPenalty * 36                   // 直近重複回避
         + olderOverlapPenalty * 16                    // 過去重複回避
         + repeatSetPenalty * 220                      // 同一組回避
   ```

3. **バックトラック探索** (`findBestRestCombination`):
   - 候補者の全組み合わせを探索し、最小スコアの組み合わせを選択
   - 計算量制御のため候補者数を制限

4. **動的重み調整**:
   - 参加者数が定員の1.5倍超 + 全員試合回数同一の場合、連続休憩を許可
   - 重み係数を0にして連続休憩ペナルティを無効化

#### ステップ3: ペア形成 (`buildPairs`)

休憩者を除いた出場者でペアを形成：

1. **試行ベース最適化**: 6回の試行で最適ペアを探索
2. **段階的選択**:
   - 試合回数少ない順に基準選手を選択
   - 各基準選手に対して最適パートナーを候補から選択
   - 最近のペア重複を重み付きペナルティで評価
3. **制限付きランダム性**: 上位3候補からランダム選択で局所最適解を回避

**再登場ペナルティ計算**:
```typescript
penalty = max(BASE - (distance_from_recent - 1) * DECAY, MINIMUM)
```

#### ステップ4: コート配置 (`buildCourtsFromPairs`)

形成されたペア同士を対戦させるコートを決定：

1. **バックトラック探索**: 全ペア組み合わせを探索
2. **対戦重複ペナルティ**: 最近の対戦相手との重複を重み付きで評価
3. **最小コスト配置**: 対戦重複ペナルティ合計が最小の配置を選択

#### 特殊状況への対応

1. **人数不足** (4名未満): 全員休憩
2. **完全一致** (定員ちょうど): 全員出場、休憩者なし
3. **最適化失敗**: フォールバック戦略でソート順ペアリング
4. **途中参加**: `playedOffset` による試合回数調整で既存参加者と公平性維持

#### アルゴリズムの特徴

- **計算量制御**: バックトラック探索に制限を設け、実用的な時間内で完了
- **確率的要素**: ランダム要素により多様な解を探索、単調な組み合わせを回避
- **段階的最適化**: 各段階で局所的に最適化し、全体の計算量を管理
- **動的調整**: 参加状況に応じて重み係数を自動調整
- **履歴考慮**: 最近5回の履歴を重み付きで評価し、短期的重複を強力に回避

このアルゴリズムにより、参加者8〜24名・コート2〜6面で1秒以内に高品質な組み合わせを生成可能です。

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
