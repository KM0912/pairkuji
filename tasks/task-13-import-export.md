# インポート・エクスポート機能実装

## 作業内容
CSV/JSONでのデータ入出力機能とエクスポートページの実装

## 実装ファイル
- `src/app/session/[id]/export/page.tsx`
- `src/components/ImportExportPanel.tsx`
- `src/lib/import-export.ts`

## 必要な機能
- 参加者名簿のCSVインポート
- セッション全体のJSONエクスポート
- データの検証・エラーハンドリング
- プレビュー機能

## import-export.tsの実装
```typescript
// CSV形式での参加者インポート
export const importPlayersFromCSV = async (
  file: File,
  sessionId: string
): Promise<{ success: Player[], errors: string[] }> => {};

// JSON形式でのセッションエクスポート
export const exportSessionToJSON = async (
  sessionId: string
): Promise<SessionExport> => {};

// CSVダウンロード生成
export const generateCSVDownload = (data: any[]): string => {};

interface SessionExport {
  session: Session;
  players: Player[];
  rounds: Round[];
  stats: PlayerStats[];
  exportedAt: string;
}
```

## ImportExportPanelの要件
- ファイル選択UI
- インポートプレビュー
- エクスポートボタン
- 進捗表示
- エラーメッセージ表示

## CSVフォーマット
```csv
名前,タグ1,タグ2
田中太郎,初心者,
山田花子,経験者,強い
佐藤次郎,,,
```

## チェックリスト
- [ ] `src/app/session/[id]/export/page.tsx` 実装
- [ ] `src/components/ImportExportPanel.tsx` 実装
- [ ] `src/lib/import-export.ts` 実装
- [ ] CSVパーサー実装
- [ ] JSONシリアライザー実装
- [ ] ファイルダウンロード機能実装
- [ ] バリデーション機能実装
- [ ] エラーハンドリング実装