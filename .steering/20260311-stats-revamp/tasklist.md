# タスクリスト

## フェーズ1: データ基盤

- [x] practiceStoreにsessions状態とloadSessions()アクションを追加
  - [x] State型にsessions: PracticeSession[]を追加
  - [x] loadSessions()でdb.practiceSessions.toArray()を実行
  - [x] 初期値を空配列に設定

- [x] statsCalculator.tsを作成
  - [x] calculateOverallStats(): 全セッション+現在セッションの通算勝率を計算
  - [x] calculateSessionWinRates(): セッション別の勝率を計算
  - [x] calculatePairWinRates(): ペア別の通算勝率を計算
  - [x] calculateHeadToHead(): 直接対決の勝敗を計算

- [x] statsCalculator.test.tsを作成
  - [x] calculateOverallStats のテスト
  - [x] calculateSessionWinRates のテスト
  - [x] calculatePairWinRates のテスト
  - [x] calculateHeadToHead のテスト

## フェーズ2: UIコンポーネント実装

- [x] OverallStatsPanel.tsx を作成
  - [x] 通算勝率ランキング表示（名前、W/L、勝率、参加セッション数、通算試合数）
  - [x] 勝率バー表示
  - [x] データなし時の空状態メッセージ

- [x] WinRateTrendChart.tsx を作成
  - [x] SVGによる折れ線グラフ描画
  - [x] プレイヤー選択チップ（タップで表示/非表示切替）
  - [x] X軸: セッション番号、Y軸: 勝率（0-100%）
  - [x] chart-1〜chart-5のカラー使用
  - [x] データ不足時の表示

- [x] PairCompatibility.tsx を作成
  - [x] ペア別通算勝率ランキング
  - [x] 3試合以上のフィルタ
  - [x] ペア名（2名の名前）と勝率表示

- [x] HeadToHead.tsx を作成
  - [x] プレイヤー選択UI
  - [x] 選択プレイヤー視点での対戦成績一覧
  - [x] 天敵（最も負けている相手）・カモ（最も勝っている相手）のハイライト

## フェーズ3: 統合とページ改修

- [x] stats/page.tsx を改修
  - [x] タブ構成を変更: 通算 | 推移 | ペア相性 | 対決
  - [x] loadSessions()の呼び出し追加
  - [x] 各パネルに計算結果を渡す
  - [x] セッション未開始でも過去データがあれば表示可能にする

- [x] SessionStatsModal.tsx の統合確認
  - [x] 練習中モーダルは既存のセッション内統計を維持（変更なし）

## フェーズ4: 品質チェックと修正

- [x] すべてのテストが通ることを確認
  - [x] `npm run test:run`
- [x] リントエラーがないことを確認
  - [x] `npm run lint`
- [x] 型エラーがないことを確認
  - [x] `npm run type-check`
- [x] ビルドが成功することを確認
  - [x] `npm run build`

---

## 実装後の振り返り

### 実装完了日
2026-03-11

### 計画と実績の差分

**計画と異なった点**:
- TypeScriptのtarget設定でMap/Setのfor...ofイテレーションがエラーになったため、Array.from()パターンに変更

**新たに必要になったタスク**:
- なし

### 学んだこと

**技術的な学び**:
- tsconfigのtargetがes5の場合、Map/Setのfor...ofはdownlevelIterationフラグがないとエラーになる。Array.from().forEach()で代替可能

**プロセス上の改善点**:
- 計算ロジックを純粋関数として分離したことでテストが容易になった
- SVGグラフは外部ライブラリなしで十分実装可能

### 次回への改善提案
- グラフのインタラクション（ツールチップ等）が必要になった場合は外部ライブラリの検討が必要
- セッション数が多くなった場合のグラフスクロール対応
