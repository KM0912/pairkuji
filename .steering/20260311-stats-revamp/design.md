# 設計書

## アーキテクチャ概要

既存のアーキテクチャ（Zustand + Dexie + React）に統計計算レイヤーを追加する。過去セッションデータの読み込みはpracticeStoreに新しいアクションを追加し、統計計算は純粋関数として`src/lib/statsCalculator.ts`に集約する。

```
統計ページ (stats/page.tsx)
    │
    ├── practiceStore.loadSessions()  ← 過去セッション読み込み
    │
    ├── statsCalculator.ts           ← 通算統計計算（純粋関数）
    │
    └── 統計コンポーネント群
        ├── OverallStatsPanel.tsx     ← 通算統計ダッシュボード
        ├── WinRateTrendChart.tsx     ← 勝率推移グラフ
        ├── PairCompatibility.tsx     ← ペア相性ランキング
        └── HeadToHead.tsx           ← 直接対決成績
```

## コンポーネント設計

### 1. statsCalculator.ts（統計計算ロジック）

**責務**:
- 複数セッションのラウンドデータを統合して統計を計算
- 個人別通算勝率、セッション別勝率、ペア別勝率、直接対決成績を算出

**実装の要点**:
- 純粋関数として実装（Reactに非依存）
- PracticeSession[]とRound[]（現在のセッション）を入力として受け取る
- 既存のcalculateWinRatesのロジックを再利用

### 2. OverallStatsPanel.tsx（通算統計ダッシュボード）

**責務**:
- 個人別の通算勝率・試合数・参加セッション数を一覧表示
- 勝率ランキング形式で表示

**実装の要点**:
- 既存WinRatePanelの拡張版として実装
- セッション参加回数はplayerIdsフィールドから算出

### 3. WinRateTrendChart.tsx（勝率推移グラフ）

**責務**:
- セッションごとの勝率推移を折れ線グラフで表示
- プレイヤーの選択・フィルタ

**実装の要点**:
- SVGによる簡易折れ線グラフ（外部ライブラリ不要）
- chart-1〜chart-5のセマンティックカラーを使用
- プレイヤーをタップで表示/非表示切替

### 4. PairCompatibility.tsx（ペア相性ランキング）

**責務**:
- ペアごとの通算勝率ランキングを表示
- 最低試合数フィルタ

**実装の要点**:
- ペアが同チームにいた試合の勝敗から勝率を算出
- 3試合以上のペアのみ表示

### 5. HeadToHead.tsx（直接対決成績）

**責務**:
- プレイヤーAとBが対戦側にいた際の勝敗を表示
- 天敵・カモランキング

**実装の要点**:
- pairA vs pairBの構造から、プレイヤーが異なる側にいた場合をカウント
- 特定プレイヤー視点での天敵/カモ表示

## データフロー

### 統計ページ表示
```
1. stats/page.tsx マウント
2. practiceStore.loadSessions() で practiceSessions テーブルから全データ読み込み
3. practiceStore.load() で現在のセッションデータ読み込み
4. statsCalculator の各関数で統計計算（useMemo内）
5. 各パネルコンポーネントに計算結果を渡して描画
```

## テスト戦略

### ユニットテスト
- statsCalculator.ts: 各計算関数の正確性テスト
  - 通算勝率計算
  - セッション別勝率計算
  - ペア勝率計算
  - 直接対決成績計算

## 依存ライブラリ

新規ライブラリの追加なし。SVGによるグラフ描画で対応。

## ディレクトリ構造

```
src/
├── lib/
│   ├── statsCalculator.ts          # 新規: 通算統計計算ロジック
│   └── statsCalculator.test.ts     # 新規: テスト
├── components/stats/
│   ├── OverallStatsPanel.tsx       # 新規: 通算統計ダッシュボード
│   ├── WinRateTrendChart.tsx       # 新規: 勝率推移グラフ
│   ├── PairCompatibility.tsx       # 新規: ペア相性ランキング
│   ├── HeadToHead.tsx              # 新規: 直接対決成績
│   ├── WinRatePanel.tsx            # 既存（セッション内統計用として維持）
│   ├── PairStatsPanel.tsx          # 既存
│   ├── OpponentStatsPanel.tsx      # 既存
│   └── RoundHistory.tsx            # 既存
├── app/stats/
│   └── page.tsx                    # 改修: タブ構成変更
└── lib/stores/
    └── practiceStore.ts            # 改修: loadSessions追加
```

## 実装の順序

1. practiceStoreにloadSessions()アクション追加
2. statsCalculator.ts で統計計算ロジック実装 + テスト
3. OverallStatsPanel.tsx 実装
4. WinRateTrendChart.tsx 実装
5. PairCompatibility.tsx 実装
6. HeadToHead.tsx 実装
7. stats/page.tsx のタブ構成を変更

## パフォーマンス考慮事項

- 統計計算はuseMemoで結果をキャッシュ
- セッションデータの読み込みは初回マウント時のみ
- SVGグラフはデータポイント数に応じて適切にスケール
