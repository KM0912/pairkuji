# タスクリスト

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

### 必須ルール
- **全てのタスクを`[x]`にすること**
- 「時間の都合により別タスクとして実施予定」は禁止
- 「実装が複雑すぎるため後回し」は禁止
- 未完了タスク（`[ ]`）を残したまま作業を終了しない

### 実装可能なタスクのみを計画
- 計画段階で「実装可能なタスク」のみをリストアップ
- 「将来やるかもしれないタスク」は含めない
- 「検討中のタスク」は含めない

### タスクスキップが許可される唯一のケース
以下の技術的理由に該当する場合のみスキップ可能:
- 実装方針の変更により、機能自体が不要になった
- アーキテクチャ変更により、別の実装方法に置き換わった
- 依存関係の変更により、タスクが実行不可能になった

スキップ時は必ず理由を明記:
```markdown
- [x] ~~タスク名~~（実装方針変更により不要: 具体的な技術的理由）
```

### タスクが大きすぎる場合
- タスクを小さなサブタスクに分割
- 分割したサブタスクをこのファイルに追加
- サブタスクを1つずつ完了させる

---

## フェーズ1: 型定義とデータレイヤー

- [x] `src/types/round.ts` に `MatchResult` 型を追加し、`CourtMatch` に `result?: MatchResult` フィールドを追加
- [x] `src/types/practiceSession.ts` を新規作成し、`PracticeSession` インターフェースを定義
- [x] `src/lib/db.ts` にDBスキーマv2を追加（`practiceSessions` テーブル追加）
  - [x] `PairkujiDB` クラスに `practiceSessions` テーブルプロパティを追加
  - [x] `version(2).stores()` で `practiceSessions` テーブルを定義

## フェーズ2: ビジネスロジック

- [x] `src/lib/winRateCalculator.ts` を新規作成
  - [x] `WinRateRecord` インターフェースを定義（playerId, wins, losses, unrecorded, winRate）
  - [x] `calculateWinRates(rounds: Round[]): Map<number, WinRateRecord>` 関数を実装
- [x] `src/lib/winRateCalculator.test.ts` にユニットテストを作成
  - [x] 勝敗が混在するケースのテスト
  - [x] 未登録のみのケース（勝率null）のテスト
  - [x] 空のラウンドのケースのテスト
  - [x] 複数ラウンドの統合計算テスト

## フェーズ3: ストア拡張

- [x] `practiceStore` に `recordResult` アクションを追加
  - [x] `recordResult(roundNo: number, courtNo: number, result: MatchResult): Promise<void>` を実装
  - [x] 該当ラウンドの該当コートのresultを更新しIndexedDBに保存
- [x] `practiceStore` の `resetPractice` を修正
  - [x] リセット前にラウンドが1つ以上ある場合、`PracticeSession` を構築してアーカイブ
  - [x] `db.practiceSessions.add()` でアーカイブを保存

## フェーズ4: UI実装

- [x] `src/components/practice/CourtManagement.tsx` に結果入力UIを追加
  - [x] 各コートカードに勝利チーム選択ボタンを追加（pairA勝利/pairB勝利のタップトグル）
  - [x] 結果が記録済みの場合、勝利チーム側にハイライト表示
  - [x] `onRecordResult` コールバックpropsを追加
- [x] `src/app/practice/page.tsx` から `recordResult` を接続
  - [x] `onRecordResult` ハンドラーを定義し `CourtManagement` に渡す
- [x] `src/components/stats/WinRatePanel.tsx` を新規作成
  - [x] 各メンバーの勝率を一覧表示（勝率降順ソート）
  - [x] 勝数/負数/未登録数を表示
  - [x] 試合数0のメンバーは勝率を「-」と表示
- [x] `src/app/stats/page.tsx` に勝率タブを追加
  - [x] `Tabs` に「勝率」タブを追加（3カラムに変更）
  - [x] アーカイブセッションをDBから読み込み、全ラウンドを集約して勝率を計算

## フェーズ5: 品質チェックと修正

- [x] すべてのテストが通ることを確認
  - [x] `npm run test:run`
- [x] リントエラーがないことを確認
  - [x] `npm run lint`
- [x] 型エラーがないことを確認
  - [x] `npm run type-check`

## フェーズ6: ユーザーフィードバック対応（セッション単位化）

- [x] `src/app/stats/page.tsx` の勝率計算を現在のセッションのみに変更（アーカイブ累積を削除）
- [x] `src/app/stats/page.tsx` の空状態ガードを `!settings` に戻す（練習中のみ統計表示）
- [x] `src/components/stats/WinRatePanel.tsx` の説明文を「今回の練習の勝率」に変更
- [x] `src/app/history/page.tsx` を新規作成（過去の練習セッション一覧）
- [x] `src/app/history/[id]/page.tsx` を新規作成（セッション詳細: 勝率+ラウンド詳細）
- [x] `src/components/layout/BottomNavigation.tsx` に「履歴」タブを追加
- [x] 型チェック・リント・テスト全パス確認

---

## 実装後の振り返り

### 実装完了日
2026-03-11

### 計画と実績の差分

**計画と異なった点**:
- TypeScriptのtarget設定により`Map.values()`のイテレーションに`Array.from()`が必要だった
- 検証エージェントの指摘を受け、統計画面の表示条件を改善（`!settings`ガードをアーカイブ有無も考慮するよう変更）
- 勝利ボタンのタップ領域がアクセシビリティ基準（min-h-44px）を下回っていたため修正
- 未登録数の表示にラベルを追加（UX改善）

**新たに必要になったタスク**:
- 検証後の品質修正3件（統計画面の表示条件、タップ領域、未登録ラベル）

**技術的理由でスキップしたタスク**（該当する場合のみ）:
- なし（全タスク完了）

### 学んだこと

**技術的な学び**:
- Dexie.jsのスキーマバージョニングはテーブル追加のみなら`.upgrade()`不要で簡単
- `result?: MatchResult`のオプショナルフィールドにより既存データとの後方互換性を自然に実現
- `Map.values()`はTypeScriptのtarget設定によってはイテレーション不可のため`Array.from()`を使う

**プロセス上の改善点**:
- 検証エージェントによるレビューでアクセシビリティやUXの問題を早期発見できた
- tasklist.mdのリアルタイム更新により進捗が明確に追跡できた

### 次回への改善提案
- タップ領域のサイズは実装前にガイドラインを再確認する習慣をつける
- 統計画面のような「データがない場合」の表示条件は設計段階で考慮する
- 将来機能（パートナー別勝率、連勝表示、セッション履歴一覧）はスコープ外として明確化済み
