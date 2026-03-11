# 設計書

## アーキテクチャ概要

既存の3層アーキテクチャ（UI → Zustand Store → Dexie/IndexedDB）に沿って実装する。主な変更点:

1. **型定義の拡張**: CourtMatchにresultフィールド追加
2. **データレイヤー**: DBスキーマv2でpracticeSessionsテーブル追加
3. **状態管理**: practiceStoreに結果記録・アーカイブアクション追加
4. **UI**: コートカードに結果入力UI追加、統計画面に勝率タブ追加

```
┌────────────┐    ┌──────────────┐    ┌──────────────────┐
│ CourtCard  │───→│practiceStore │───→│ IndexedDB        │
│ (結果入力) │    │ (結果記録)   │    │ rounds (result)  │
│            │    │ (アーカイブ) │    │ practiceSessions │
└────────────┘    └──────────────┘    └──────────────────┘
                         │
┌────────────┐           │
│ WinRateTab │───→ 全セッションから勝率計算
└────────────┘
```

## コンポーネント設計

### 1. CourtMatch型の拡張（src/types/round.ts）

**変更内容**:
- `result?: 'pairA' | 'pairB' | null` フィールドを追加
- `undefined`（フィールドなし）と`null`（明示的に未登録）の両方を未登録として扱う

**後方互換性**:
- 既存データにはresultフィールドが存在しないため、`undefined`として読み込まれる
- `undefined`と`null`は同じ「未登録」として扱う

### 2. MatchResult型（src/types/round.ts）

```typescript
export type MatchResult = 'pairA' | 'pairB' | null;
```

### 3. PracticeSession型（src/types/practiceSession.ts）

**責務**: 練習セッションのアーカイブデータを表現

```typescript
export interface PracticeSession {
  id?: number;          // 自動採番
  startedAt: string;    // セッション開始日時（ISO 8601）
  endedAt: string;      // セッション終了日時（ISO 8601）
  courts: number;       // コート数
  playerIds: number[];  // 参加者のmemberIdリスト
  rounds: Round[];      // 全ラウンドデータ（結果含む）
}
```

### 4. practiceStoreの拡張（src/lib/stores/practiceStore.ts）

**新しいアクション**:
- `recordResult(roundNo: number, courtNo: number, result: MatchResult)`: 試合結果を記録
- `resetPractice()` の修正: リセット前にセッションをアーカイブ

### 5. WinRatePanel（src/components/stats/WinRatePanel.tsx）

**責務**: 各メンバーの勝率を一覧表示

**表示内容**:
- メンバー名
- 勝数 / 負数 / 未登録数
- 勝率（勝ち / (勝ち + 負け)）
- 試合数0の場合は「-」

### 6. 勝率計算ロジック（src/lib/winRateCalculator.ts）

**責務**: 全セッション（現在 + アーカイブ）から各メンバーの勝率を計算

**計算ルール**:
- 各CourtMatchのresultから勝ちチーム・負けチームを判定
- `result === 'pairA'` → pairAの2名が勝ち、pairBの2名が負け
- `result === 'pairB'` → pairBの2名が勝ち、pairAの2名が負け
- `result === null || result === undefined` → 未登録（勝率計算から除外）
- 勝率 = wins / (wins + losses)、(wins + losses) === 0の場合はnull

## データフロー

### 試合結果記録
```
1. ユーザーがコートカードの勝利ボタンをタップ
2. practiceStore.recordResult(roundNo, courtNo, result) を呼び出し
3. ストアが該当ラウンドのCourtMatchを更新
4. IndexedDBのroundsテーブルに保存
5. Zustand状態を更新 → UIに反映
```

### 練習リセット（アーカイブ付き）
```
1. ユーザーがリセットを確認
2. resetPractice() が呼ばれる
3. ラウンドが1つ以上ある場合、PracticeSessionオブジェクトを構築
4. practiceSessionsテーブルにアーカイブを保存
5. 既存のpracticeSettings, practicePlayers, roundsをクリア
6. Zustand状態をリセット
```

### 勝率計算
```
1. 統計画面で勝率タブを選択
2. 現在のroundsとアーカイブのpracticeSessionsから全ラウンドを収集
3. 各CourtMatchのresultを集計
4. メンバーごとの勝数・負数・勝率を計算
5. 勝率降順でソートして表示
```

## エラーハンドリング戦略

### エラーハンドリングパターン

既存のパターンに従い、ストアの`error`フィールドにエラーメッセージを格納する。

- DB書き込み失敗: `error`に設定、UIでバナー表示
- 不正なresult値: TypeScriptの型で防止（ランタイムバリデーション不要）

## テスト戦略

### ユニットテスト
- `winRateCalculator.ts`: 勝率計算ロジックのテスト
  - 正常系: 勝敗が混在するケース
  - 未登録のみのケース（勝率null）
  - 空のラウンドのケース
  - 複数セッションの統合計算

## 依存ライブラリ

新規ライブラリの追加は不要。既存のDexie.js、Zustand、Reactで実装可能。

## ディレクトリ構造

```
src/
├── types/
│   ├── round.ts              # CourtMatchにresultフィールド追加、MatchResult型追加
│   └── practiceSession.ts    # 新規: PracticeSession型
├── lib/
│   ├── db.ts                 # version(2)追加: practiceSessionsテーブル
│   ├── winRateCalculator.ts  # 新規: 勝率計算ロジック
│   └── stores/
│       └── practiceStore.ts  # recordResult追加、resetPractice修正
├── components/
│   ├── practice/
│   │   └── CourtManagement.tsx  # 結果入力UI追加
│   └── stats/
│       └── WinRatePanel.tsx     # 新規: 勝率統計パネル
└── app/
    └── stats/
        └── page.tsx             # 勝率タブ追加
```

## 実装の順序

1. 型定義（MatchResult, PracticeSession）
2. DBスキーマv2（practiceSessionsテーブル追加）
3. 勝率計算ロジック（winRateCalculator.ts）+ テスト
4. practiceStore拡張（recordResult, resetPracticeアーカイブ）
5. CourtManagement UIに結果入力追加
6. WinRatePanel + 統計画面に勝率タブ追加

## セキュリティ考慮事項

- データはすべてローカルIndexedDBに保存（サーバー送信なし）
- 追加の個人情報は保存しない（既存のmemberIdのみ参照）

## パフォーマンス考慮事項

- 勝率計算は全アーカイブセッションを走査するが、データ量は軽微（数千件でも数ms）
- 統計画面表示時にuseMemoでキャッシュし、不要な再計算を防止

## 将来の拡張性

- スコア記録: CourtMatchに`score?: { pairA: number, pairB: number }`を追加可能
- パートナー別勝率: winRateCalculator.tsを拡張してペア・対戦相手ごとの集計が可能
- セッション履歴一覧: practiceSessionsテーブルから直接クエリ可能
