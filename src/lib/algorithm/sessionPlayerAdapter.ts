import type { Member, SessionPlayer, Player, PlayerStats } from '../../types';
import { generateOptimalRound } from './fairness';

/**
 * SessionPlayer + Member データを従来のPlayerデータに変換して
 * 既存の公平性アルゴリズムを使用するためのアダプタ
 */
export function generateOptimalRoundFromSessionPlayers(
  sessionId: string,
  sessionMembersData: { member: Member; sessionPlayer: SessionPlayer }[],
  stats: PlayerStats[],
  courtCount: number
) {
  // SessionPlayer + Member を Player 形式に変換
  const adaptedPlayers: Player[] = sessionMembersData.map(({ member, sessionPlayer }) => ({
    id: member.id, // memberのidをplayerIdとして使用
    sessionId: sessionPlayer.sessionId,
    name: member.name,
    tags: member.tags,
    status: sessionPlayer.status,
  }));

  // 統計データのplayerIdをmemberIdに合わせて調整
  const adaptedStats: PlayerStats[] = stats.map(stat => ({
    ...stat,
    playerId: stat.playerId, // 既にmemberIdが設定されていることを前提
  }));

  return generateOptimalRound(sessionId, adaptedPlayers, adaptedStats, courtCount);
}