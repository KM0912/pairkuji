# 設計書

## アーキテクチャ概要

statsCalculatorの既存関数はそのまま利用する。フィルタリングはstats/page.tsx内のuseMemoレイヤーで、sessionsをフィルタしてからcalculator関数に渡す。

## コンポーネント設計

### 1. PeriodFilter.tsx（期間フィルタUI）

**責務**:
- フィルタ選択肢の表示とユーザー操作のハンドリング

**実装の要点**:
- 横スクロール可能なピル型ボタン群
- 選択中はprimary色、未選択はmuted色
- propsでvalue/onChangeを受け取る（状態はpage.tsxで管理）

### 2. filterSessions ヘルパー関数（statsCalculator.ts内）

**責務**:
- PracticeSession[]をフィルタタイプに応じて絞り込む

**実装の要点**:
- 純粋関数、statsCalculator.tsにexport
- 「今回」→ 空配列（currentRoundsのみ使用）
- 「過去3回」→ startedAt降順で直近3つ
- 「今月」→ startedAtが今月のもの
- 「全期間」→ そのまま返す

## データフロー

```
PeriodFilter (ユーザー選択)
    ↓ onChange
stats/page.tsx (state: periodFilter)
    ↓ useMemo
filterSessions(sessions, periodFilter) → filteredSessions
    ↓
calculateOverallStats(filteredSessions, currentRounds)
calculateSessionWinRates(filteredSessions, currentRounds)
calculatePairWinRates(filteredSessions, currentRounds)
HeadToHead(filteredSessions, currentRounds, ...)
```

## ディレクトリ構造

```
src/
├── components/stats/
│   └── PeriodFilter.tsx        # 新規
├── lib/
│   └── statsCalculator.ts      # 改修: filterSessions追加
└── app/stats/
    └── page.tsx                # 改修: フィルタ状態管理追加
```

## 実装の順序

1. statsCalculator.tsにfilterSessions関数を追加 + テスト
2. PeriodFilter.tsxコンポーネントを作成
3. stats/page.tsxにフィルタ状態管理とUI統合
