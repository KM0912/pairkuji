# 公平性アルゴリズム実装

## 作業内容
休憩偏りを最小化するコア組み合わせアルゴリズムの実装

## 実装ファイル
- `src/lib/algorithm/fairness.ts`
- `src/lib/algorithm/types.ts` - アルゴリズム専用型定義

## 必要な機能

### スコア関数
```typescript
// 以下の要素を最小化するスコア計算
const calculateScore = (assignment: Assignment): number => {
  const restVariance = 4 * variance(restCounts);
  const playVariance = 4 * variance(playCounts);
  const consecPenalty = 6 * sumConsecutiveRestPenalty();
  const pairDuplication = 2 * sumRecentPairDuplicates();
  const matchDuplication = 1 * sumRecentMatchDuplicates();
  
  return restVariance + playVariance + consecPenalty + 
         pairDuplication + matchDuplication;
};
```

### アルゴリズム手順
1. 候補者を休憩優先でソート
2. 約200回のランダム配置試行
3. 各配置のスコア計算
4. 最適解選択

## 実装例
```typescript
interface Assignment {
  courts: CourtMatch[];
  rests: number[];
  score: number;
}

export function generateOptimalRound(
  sessionId: string,
  players: Player[],
  stats: PlayerStats[],
  courtCount: number
): Assignment {
  const candidates = sortPlayersByPriority(players, stats);
  let bestAssignment: Assignment | null = null;
  
  for (let i = 0; i < 200; i++) {
    const assignment = generateRandomAssignment(candidates, courtCount);
    if (!bestAssignment || assignment.score < bestAssignment.score) {
      bestAssignment = assignment;
    }
  }
  
  return bestAssignment!;
}
```

## チェックリスト
- [ ] `src/lib/algorithm/` ディレクトリ作成
- [ ] スコア関数実装
- [ ] 候補者ソート機能実装
- [ ] ランダム配置生成実装
- [ ] 重複回避ロジック実装
- [ ] パフォーマンステスト（1秒以内）
- [ ] 40名5コートでの動作確認