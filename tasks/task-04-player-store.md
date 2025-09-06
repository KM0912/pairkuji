# プレイヤーストア実装

## 作業内容
参加者管理用のZustandストア実装

## 実装ファイル
- `src/lib/stores/playerStore.ts`

## 必要な機能
- 参加者CRUD操作
- 参加者ステータス管理（active/rest/absent）
- セッションごとの参加者取得
- 参加者検索・フィルタリング

## 実装例
```typescript
interface PlayerStore {
  // State
  players: Player[];
  
  // Actions
  addPlayer: (sessionId: string, name: string, tags?: string[]) => Promise<number>;
  updatePlayer: (id: number, data: Partial<Omit<Player, 'id'>>) => Promise<void>;
  updatePlayerStatus: (id: number, status: Player['status']) => Promise<void>;
  removePlayer: (id: number) => Promise<void>;
  
  // Queries
  getPlayersBySession: (sessionId: string) => Player[];
  getActivePlayers: (sessionId: string) => Player[];
  searchPlayers: (sessionId: string, query: string) => Player[];
  
  // Bulk operations
  loadPlayersBySession: (sessionId: string) => Promise<void>;
  importPlayers: (sessionId: string, names: string[]) => Promise<void>;
}
```

## チェックリスト
- [ ] `src/lib/stores/playerStore.ts` 作成
- [ ] 基本CRUD操作実装
- [ ] ステータス管理機能実装
- [ ] セッション別データ取得実装
- [ ] 検索・フィルタリング機能実装
- [ ] 一括操作機能実装
- [ ] IndexedDBとの連携確認