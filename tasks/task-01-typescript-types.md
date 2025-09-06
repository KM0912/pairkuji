# TypeScript型定義実装

## 作業内容
`src/types/` ディレクトリにアプリケーション全体で使用する型定義を作成

## 実装ファイル
- `src/types/index.ts` - 全型定義のエクスポート
- `src/types/session.ts` - セッション関連の型
- `src/types/player.ts` - プレイヤー関連の型
- `src/types/round.ts` - ラウンド関連の型
- `src/types/stats.ts` - 統計関連の型

## 必要な型定義
```typescript
// session.ts
interface Session {
  id: string;
  title?: string;
  courts: number;
  minutesPerGame: number;
  currentRound: number;
  createdAt: string;
  updatedAt: string;
}

// player.ts
interface Player {
  id: number;
  sessionId: string;
  name: string;
  tags?: string[];
  status: 'active' | 'rest' | 'absent';
}

// round.ts
interface CourtMatch {
  courtNo: number;
  team1: [number, number]; // playerIds
  team2: [number, number]; // playerIds
}

interface Round {
  sessionId: string;
  roundNo: number;
  courts: CourtMatch[];
  rests: number[]; // playerIds
}

// stats.ts
interface PlayerStats {
  sessionId: string;
  playerId: number;
  playedCount: number;
  restCount: number;
  consecRest: number;
  recentPartners: number[];
  recentOpponents: number[];
}
```

## チェックリスト
- [ ] `src/types/` ディレクトリ作成
- [ ] 各型定義ファイル作成
- [ ] エクスポート設定
- [ ] 型の一貫性確認
- [ ] TypeScript型チェック通過確認