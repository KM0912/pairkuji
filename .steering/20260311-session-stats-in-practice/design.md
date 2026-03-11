# 設計書

## アーキテクチャ概要

既存の統計コンポーネント（WinRatePanel, PairStatsPanel, OpponentStatsPanel）をそのまま再利用し、練習ページのラウンド履歴モーダル内にタブUIとして組み込む。統計の計算ロジックは `/stats` ページと同じものを練習ページ側にも配置する。

```
practice/page.tsx
  └─ Dialog (ラウンド履歴モーダル)
      └─ Tabs
          ├─ [履歴] → 既存のラウンド履歴表示
          ├─ [勝率] → WinRatePanel
          ├─ [ペア] → PairStatsPanel
          └─ [対戦] → OpponentStatsPanel
```

## コンポーネント設計

### 1. SessionStatsModal（新規コンポーネント）

**責務**:
- ラウンド履歴と統計情報を統合するモーダルコンポーネント
- タブによる表示切り替え

**実装の要点**:
- `src/components/practice/SessionStatsModal.tsx` に配置
- Radix UI Tabs を使用（既存の `@/components/ui/tabs` を利用）
- Radix UI Dialog を使用（既存の `@/components/ui/dialog` を利用）
- 統計計算ロジック（pairCounts, opponentCounts, winRates）はpropsで受け取る
- モーダルの高さは `max-h-[70vh]` 程度で、内部スクロール可能にする

**Props**:
```typescript
interface SessionStatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rounds: Round[];
  players: PracticePlayer[];
  memberMap: Map<number, Member>;
  pairCounts: Map<string, number>;
  opponentCounts: Map<string, number>;
  winRates: Map<number, WinRateRecord>;
}
```

### 2. 既存コンポーネントの再利用

**WinRatePanel**: 変更なし。propsは既存のまま。
**PairStatsPanel**: 変更なし。propsは既存のまま。
**OpponentStatsPanel**: 変更なし。propsは既存のまま。

## データフロー

### ラウンド履歴・統計モーダルの表示
```
1. ユーザーが「ラウンド N」ボタンをタップ
2. SessionStatsModal が開く
3. タブ切り替えで履歴/勝率/ペア/対戦相手を表示
4. 統計データは practice/page.tsx で useMemo 計算し、propsで渡す
```

## 変更ファイル一覧

### 新規作成
- `src/components/practice/SessionStatsModal.tsx` - ラウンド履歴＋統計モーダル

### 変更
- `src/app/practice/page.tsx` - 統計計算ロジック追加、既存ラウンド履歴モーダルをSessionStatsModalに置き換え

## 実装の順序

1. SessionStatsModal コンポーネントの作成
2. practice/page.tsx に統計計算ロジック（pairCounts, opponentCounts, winRates）を追加
3. 既存のラウンド履歴モーダルを SessionStatsModal に置き換え
4. 動作確認

## パフォーマンス考慮事項

- 統計計算は useMemo でメモ化済み（rounds, players の変更時のみ再計算）
- モーダルは非表示時にはレンダリングされない（Dialog の特性）
