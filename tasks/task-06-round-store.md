# ラウンドストア実装

## 作業内容
ラウンド生成・管理・タイマー制御用Zustandストア実装

## 実装ファイル
- `src/lib/stores/roundStore.ts`

## 必要な機能
- ラウンド生成（公平性アルゴリズム使用）
- ラウンド確定・巻き戻し
- タイマー制御
- 手動調整機能

## 実装例
```typescript
interface RoundStore {
  // State
  currentRound: Round | null;
  rounds: Round[];
  timerState: {
    isRunning: boolean;
    startTime: Date | null;
    remainingMs: number;
  };
  
  // Round Management
  generateRound: (sessionId: string) => Promise<Round>;
  confirmRound: (sessionId: string, roundNo: number) => Promise<void>;
  rollbackRound: (sessionId: string) => Promise<void>;
  
  // Manual Adjustments
  swapPlayers: (playerId1: number, playerId2: number) => void;
  moveToRest: (playerId: number) => void;
  moveToPlay: (playerId: number, courtNo: number, position: number) => void;
  
  // Timer Control
  startTimer: (durationMs: number) => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  
  // Data Loading
  loadRounds: (sessionId: string) => Promise<void>;
}
```

## チェックリスト
- [ ] `src/lib/stores/roundStore.ts` 作成
- [ ] 公平性アルゴリズム統合
- [ ] ラウンド生成機能実装
- [ ] 手動調整機能実装
- [ ] タイマー機能実装
- [ ] IndexedDBとの連携実装
- [ ] エラーハンドリング追加