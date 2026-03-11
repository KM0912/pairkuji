import type { Round } from '@/types/round';

export interface WinRateRecord {
  playerId: number;
  wins: number;
  losses: number;
  unrecorded: number;
  winRate: number | null;
}

/**
 * 全ラウンドから各プレイヤーの勝率を計算する
 * @param rounds - 集計対象のラウンド配列
 * @returns プレイヤーID → WinRateRecord のマップ
 */
export function calculateWinRates(
  rounds: Round[]
): Map<number, WinRateRecord> {
  const records = new Map<number, WinRateRecord>();

  const getOrCreate = (playerId: number): WinRateRecord => {
    let record = records.get(playerId);
    if (!record) {
      record = { playerId, wins: 0, losses: 0, unrecorded: 0, winRate: null };
      records.set(playerId, record);
    }
    return record;
  };

  for (const round of rounds) {
    for (const court of round.courts) {
      const allPlayers = [...court.pairA, ...court.pairB];

      if (court.result == null) {
        // undefined or null → 未登録
        for (const id of allPlayers) {
          getOrCreate(id).unrecorded++;
        }
      } else if (court.result === 'pairA') {
        for (const id of court.pairA) {
          getOrCreate(id).wins++;
        }
        for (const id of court.pairB) {
          getOrCreate(id).losses++;
        }
      } else if (court.result === 'pairB') {
        for (const id of court.pairB) {
          getOrCreate(id).wins++;
        }
        for (const id of court.pairA) {
          getOrCreate(id).losses++;
        }
      }
    }
  }

  // 勝率を計算
  Array.from(records.values()).forEach((record) => {
    const total = record.wins + record.losses;
    record.winRate = total > 0 ? record.wins / total : null;
  });

  return records;
}
