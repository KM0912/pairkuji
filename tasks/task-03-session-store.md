# セッションストア実装

## 作業内容
Zustandを使用したセッション管理ストアの実装

## 実装ファイル
- `src/lib/stores/sessionStore.ts`

## 必要な機能
- セッション作成・更新・削除
- 現在のセッション管理
- 自動保存（デバウンス500ms）
- セッション復元

## 実装例
```typescript
interface SessionStore {
  // State
  currentSession: Session | null;
  sessions: Session[];
  
  // Actions
  createSession: (data: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateSession: (id: string, data: Partial<Session>) => Promise<void>;
  loadSession: (id: string) => Promise<void>;
  loadAllSessions: () => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  
  // Auto-save
  autoSave: boolean;
  setAutoSave: (enabled: boolean) => void;
}
```

## チェックリスト
- [ ] Zustandライブラリインストール確認
- [ ] `src/lib/stores/sessionStore.ts` 作成
- [ ] 基本CRUD操作実装
- [ ] デバウンス付き自動保存実装
- [ ] IndexedDBとの連携実装
- [ ] エラーハンドリング追加