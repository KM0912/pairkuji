# タスクリスト

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

### 必須ルール
- **全てのタスクを`[x]`にすること**
- 「時間の都合により別タスクとして実施予定」は禁止
- 「実装が複雑すぎるため後回し」は禁止
- 未完了タスク（`[ ]`）を残したまま作業を終了しない

---

## フェーズ1: SessionStatsModal コンポーネント作成

- [x] `src/components/practice/SessionStatsModal.tsx` を新規作成
  - [x] Tabs コンポーネント（履歴・勝率・ペア・対戦相手の4タブ）を実装
  - [x] 「履歴」タブ: 既存のラウンド履歴表示ロジックを移植
  - [x] 「勝率」タブ: WinRatePanel を表示
  - [x] 「ペア」タブ: PairStatsPanel を表示
  - [x] 「対戦相手」タブ: OpponentStatsPanel を表示
  - [x] Dialog + スクロール可能なレイアウト実装

## フェーズ2: practice/page.tsx への統合

- [x] practice/page.tsx に統計計算ロジックを追加
  - [x] pairCounts の useMemo 計算（/stats から移植）
  - [x] opponentCounts の useMemo 計算（/stats から移植）
  - [x] winRates の useMemo 計算（calculateWinRates 利用）
- [x] 既存のラウンド履歴モーダル（Dialog）を SessionStatsModal に置き換え
  - [x] 既存のラウンド履歴モーダルの Dialog コードを削除
  - [x] SessionStatsModal をインポートし、必要なpropsを渡す

## フェーズ3: 品質チェックと修正

- [x] 型エラーがないことを確認
  - [x] `npm run type-check`
- [x] リントエラーがないことを確認
  - [x] `npm run lint`
- [x] ビルドが成功することを確認
  - [x] `npm run build`

## フェーズ4: ドキュメント更新

- [x] 実装後の振り返り（このファイルの下部に記録）

---

## 実装後の振り返り

### 実装完了日
2026-03-11

### 計画と実績の差分

**計画と異なった点**:
- 計画通りに実装完了。既存コンポーネント（WinRatePanel, PairStatsPanel, OpponentStatsPanel）をそのまま再利用できた

**新たに必要になったタスク**:
- なし

### 学んだこと

**技術的な学び**:
- 既存の統計コンポーネントがprops経由でデータを受け取る設計だったため、別ページへの移植が容易だった
- Radix UI の Tabs + Dialog の組み合わせでモーダル内タブUIがシンプルに実装できた

**プロセス上の改善点**:
- 既存コンポーネントの再利用を前提とした設計により、変更ファイル数を最小限に抑えられた

### 次回への改善提案
- /stats ページの累計統計化は、practiceSessionsテーブルからの集約ロジックが必要になるため、別途設計が必要
