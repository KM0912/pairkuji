# 自動保存機能実装

## 作業内容
端末クラッシュ対策の500msデバウンス自動保存機能実装

## 実装ファイル
- `src/hooks/useAutoSave.ts`
- `src/lib/auto-save.ts`

## 必要な機能
- 状態変更の検知
- 500msデバウンス処理
- IndexedDBへの自動保存
- updatedAtタイムスタンプ自動更新
- エラー時の再試行機能

## useAutoSaveフックの実装
```typescript
interface UseAutoSaveOptions {
  delay?: number; // デバウンス時間（デフォルト500ms）
  maxRetries?: number; // 再試行回数
}

export function useAutoSave<T>(
  data: T,
  saveFunction: (data: T) => Promise<void>,
  options: UseAutoSaveOptions = {}
): {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
} {
  // useDebounce + useEffect での実装
}
```

## auto-save.tsの実装
```typescript
export class AutoSaveManager {
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  
  public scheduleAutoSave<T>(
    key: string,
    data: T,
    saveFunction: (data: T) => Promise<void>,
    delay = 500
  ): void {
    // デバウンス処理で自動保存スケジュール
  }
  
  public cancelAutoSave(key: string): void {
    // 予定された自動保存をキャンセル
  }
}
```

## 各ストアへの統合
- sessionStore: セッション変更時の自動保存
- playerStore: 参加者変更時の自動保存  
- roundStore: ラウンド変更時の自動保存
- statsStore: 統計更新時の自動保存

## チェックリスト
- [ ] `src/hooks/useAutoSave.ts` 実装
- [ ] `src/lib/auto-save.ts` 実装
- [ ] デバウンス機能実装
- [ ] エラーハンドリング・再試行機能実装
- [ ] 各ストアへの自動保存統合
- [ ] 保存状態UI表示機能
- [ ] パフォーマンステスト実施