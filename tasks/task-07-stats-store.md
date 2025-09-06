# 統計ストア実装

## 作業内容
プレイヤー統計管理用Zustandストア実装

## 実装ファイル
- `src/lib/stores/statsStore.ts`

## 必要な機能
- ラウンド確定時の統計自動更新
- プレイヤー別統計データ管理
- 統計データ計算・集計

## 実装例
```typescript
interface StatsStore {
  // State
  stats: PlayerStats[];
  
  // Actions
  updateStatsForRound: (sessionId: string, round: Round) => Promise<void>;
  recalculateStats: (sessionId: string) => Promise<void>;
  getPlayerStats: (sessionId: string, playerId: number) => PlayerStats | null;
  
  // Statistics
  getSessionSummary: (sessionId: string) => {
    totalRounds: number;
    avgPlayCount: number;
    avgRestCount: number;
    maxConsecRest: number;
  };
  
  // Data Loading
  loadStats: (sessionId: string) => Promise<void>;
  resetStats: (sessionId: string) => Promise<void>;
}
```

## 統計更新ロジック
```typescript
const updateStatsForRound = (round: Round) => {
  // 出場者の統計更新
  round.courts.forEach(court => {
    [court.team1, court.team2].flat().forEach(playerId => {
      updatePlayerPlayStats(playerId, round);
    });
  });
  
  // 休憩者の統計更新
  round.rests.forEach(playerId => {
    updatePlayerRestStats(playerId, round);
  });
};
```

## チェックリスト
- [ ] `src/lib/stores/statsStore.ts` 作成
- [ ] 基本統計更新機能実装
- [ ] 統計計算ロジック実装
- [ ] 統計集計機能実装
- [ ] パートナー・対戦相手履歴管理
- [ ] IndexedDBとの連携実装
- [ ] 統計リセット機能実装