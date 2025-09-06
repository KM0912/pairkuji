# データベース設定（Dexie + IndexedDB）

## 作業内容
IndexedDBをラップするDexieライブラリの設定とデータベーススキーマ定義

## 実装ファイル
- `src/lib/db.ts` - Dexieデータベース設定
- `src/lib/database/` - CRUD操作関数（オプション）

## 必要な実装
```typescript
// db.ts の構造例
import Dexie from 'dexie';
import type { Session, Player, Round, PlayerStats } from '@/types';

class PairkujiDB extends Dexie {
  sessions!: Dexie.Table<Session, string>;
  players!: Dexie.Table<Player, number>;
  rounds!: Dexie.Table<Round, [string, number]>;
  playerStats!: Dexie.Table<PlayerStats, [string, number]>;

  constructor() {
    super('PairkujiDB');
    this.version(1).stores({
      sessions: 'id, title, createdAt, updatedAt',
      players: '++id, sessionId, name, status',
      rounds: '[sessionId+roundNo], sessionId, roundNo',
      playerStats: '[sessionId+playerId], sessionId, playerId'
    });
  }
}

export const db = new PairkujiDB();
```

## チェックリスト
- [ ] Dexieライブラリインストール確認
- [ ] `src/lib/db.ts` ファイル作成
- [ ] データベーススキーマ定義
- [ ] テーブル設定
- [ ] エクスポート設定
- [ ] 基本的なCRUD動作確認