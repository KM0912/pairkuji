import type { Player, PlayerStats, CourtMatch } from '../../types';
import type {
  Assignment,
  PlayerPriority,
  ScoreComponents,
  GenerationConfig,
} from './types';
import { DEFAULT_CONFIG } from './types';

export function generateOptimalRound(
  sessionId: string,
  players: Player[],
  stats: PlayerStats[],
  courtCount: number,
  config: Partial<GenerationConfig> = {}
): Assignment {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const activePlayers = players.filter(p => p.sessionId === sessionId && p.status === 'active');
  
  if (activePlayers.length < 4) {
    throw new Error('最低4名のアクティブなプレイヤーが必要です');
  }

  const candidates = sortPlayersByPriority(activePlayers, stats);
  let bestAssignment: Assignment | null = null;
  
  for (let attempt = 0; attempt < mergedConfig.maxAttempts; attempt++) {
    try {
      const assignment = generateRandomAssignment(candidates, courtCount, stats, mergedConfig);
      if (!bestAssignment || assignment.score < bestAssignment.score) {
        bestAssignment = assignment;
      }
    } catch (error) {
      continue;
    }
  }
  
  if (!bestAssignment) {
    throw new Error('有効な組み合わせを生成できませんでした');
  }
  
  return bestAssignment;
}

function sortPlayersByPriority(players: Player[], stats: PlayerStats[]): PlayerPriority[] {
  return players.map(player => {
    const playerStats = stats.find(s => s.playerId === player.id) || null;
    
    let priority = 0;
    if (playerStats) {
      priority += playerStats.restCount * 1000;
      priority -= playerStats.playedCount * 100;
      priority += playerStats.consecRest * 10000;
    }
    
    return { player, stats: playerStats, priority };
  }).sort((a, b) => b.priority - a.priority);
}

function generateRandomAssignment(
  candidates: PlayerPriority[],
  courtCount: number,
  allStats: PlayerStats[],
  config: GenerationConfig
): Assignment {
  const playersPerCourt = 4;
  const maxPlayers = courtCount * playersPerCourt;
  const playingPlayers = candidates.slice(0, Math.min(maxPlayers, candidates.length));
  const restingPlayers = candidates.slice(playingPlayers.length);
  
  shuffleArray(playingPlayers);
  
  const courts: CourtMatch[] = [];
  const playerIds = playingPlayers.map(p => p.player.id);
  
  for (let court = 0; court < Math.floor(playingPlayers.length / 4); court++) {
    const startIndex = court * 4;
    const courtPlayers = playerIds.slice(startIndex, startIndex + 4);
    
    const assignment = assignTeams(courtPlayers, allStats, config);
    
    courts.push({
      courtNo: court + 1,
      team1: assignment.team1,
      team2: assignment.team2,
    });
  }
  
  const rests = restingPlayers.map(p => p.player.id);
  const score = calculateScore(courts, rests, candidates, allStats);
  
  return { courts, rests, score };
}

function assignTeams(
  playerIds: number[],
  allStats: PlayerStats[],
  config: GenerationConfig
): { team1: [number, number]; team2: [number, number] } {
  if (playerIds.length !== 4) {
    throw new Error('チーム割り当てには4名のプレイヤーが必要です');
  }

  const combinations = [
    { team1: [playerIds[0]!, playerIds[1]!], team2: [playerIds[2]!, playerIds[3]!] },
    { team1: [playerIds[0]!, playerIds[2]!], team2: [playerIds[1]!, playerIds[3]!] },
    { team1: [playerIds[0]!, playerIds[3]!], team2: [playerIds[1]!, playerIds[2]!] },
  ];

  let bestCombination = combinations[0]!;
  let lowestPenalty = Number.MAX_VALUE;

  for (const combo of combinations) {
    const penalty = calculateTeamPenalty(combo, allStats, config);
    if (penalty < lowestPenalty) {
      lowestPenalty = penalty;
      bestCombination = combo;
    }
  }

  return {
    team1: [bestCombination.team1[0]!, bestCombination.team1[1]!],
    team2: [bestCombination.team2[0]!, bestCombination.team2[1]!],
  };
}

function calculateTeamPenalty(
  assignment: { team1: number[]; team2: number[] },
  allStats: PlayerStats[],
  config: GenerationConfig
): number {
  let penalty = 0;

  const team1Stats = assignment.team1.map(id => allStats.find(s => s.playerId === id));
  const team2Stats = assignment.team2.map(id => allStats.find(s => s.playerId === id));

  const pairPenalty1 = calculatePairPenalty(assignment.team1[0]!, assignment.team1[1]!, team1Stats[0], config);
  const pairPenalty2 = calculatePairPenalty(assignment.team2[0]!, assignment.team2[1]!, team2Stats[0], config);
  penalty += pairPenalty1 + pairPenalty2;

  for (const p1 of assignment.team1) {
    for (const p2 of assignment.team2) {
      const stats1 = allStats.find(s => s.playerId === p1);
      penalty += calculateOpponentPenalty(p1, p2, stats1, config);
    }
  }

  return penalty;
}

function calculatePairPenalty(
  playerId1: number,
  playerId2: number,
  stats: PlayerStats | undefined,
  config: GenerationConfig
): number {
  if (!stats) return 0;
  
  const recentPartners = stats.recentPartners.slice(-config.recentPartnersWindow);
  const occurrences = recentPartners.filter(id => id === playerId2).length;
  
  return occurrences * 5;
}

function calculateOpponentPenalty(
  playerId1: number,
  playerId2: number,
  stats: PlayerStats | undefined,
  config: GenerationConfig
): number {
  if (!stats) return 0;
  
  const recentOpponents = stats.recentOpponents.slice(-config.recentOpponentsWindow);
  const occurrences = recentOpponents.filter(id => id === playerId2).length;
  
  return occurrences * 2;
}

function calculateScore(
  courts: CourtMatch[],
  rests: number[],
  candidates: PlayerPriority[],
  allStats: PlayerStats[]
): number {
  const playingIds = courts.flatMap(c => [...c.team1, ...c.team2]);
  const playingStats = playingIds.map(id => allStats.find(s => s.playerId === id));
  const restingStats = rests.map(id => allStats.find(s => s.playerId === id));
  
  const playCounts = playingStats.map(s => s?.playedCount || 0);
  const allRestCounts = candidates.map(c => c.stats?.restCount || 0);
  
  const restVariance = 4 * variance(allRestCounts);
  const playVariance = 4 * variance(playCounts);
  const consecPenalty = 6 * calculateConsecutiveRestPenalty(rests, allStats);
  const pairDuplication = 2 * calculatePairDuplication(courts, allStats);
  const matchDuplication = 1 * calculateMatchDuplication(courts, allStats);
  
  return restVariance + playVariance + consecPenalty + pairDuplication + matchDuplication;
}

function variance(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const squaredDiffs = numbers.map(x => Math.pow(x - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
}

function calculateConsecutiveRestPenalty(rests: number[], allStats: PlayerStats[]): number {
  let penalty = 0;
  
  for (const playerId of rests) {
    const stats = allStats.find(s => s.playerId === playerId);
    if (stats && stats.consecRest >= 1) {
      penalty += Math.max(0, stats.consecRest - 0);
    }
  }
  
  return penalty;
}

function calculatePairDuplication(courts: CourtMatch[], allStats: PlayerStats[]): number {
  let penalty = 0;
  
  for (const court of courts) {
    const pairs = [
      [court.team1[0], court.team1[1]],
      [court.team2[0], court.team2[1]],
    ];
    
    for (const [p1, p2] of pairs) {
      const stats = allStats.find(s => s.playerId === p1);
      if (stats) {
        const occurrences = stats.recentPartners.filter(id => id === p2).length;
        penalty += occurrences;
      }
    }
  }
  
  return penalty;
}

function calculateMatchDuplication(courts: CourtMatch[], allStats: PlayerStats[]): number {
  let penalty = 0;
  
  for (const court of courts) {
    for (const p1 of court.team1) {
      for (const p2 of court.team2) {
        const stats = allStats.find(s => s.playerId === p1);
        if (stats) {
          const occurrences = stats.recentOpponents.filter(id => id === p2).length;
          penalty += occurrences;
        }
      }
    }
  }
  
  return penalty;
}

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i]!;
    array[i] = array[j]!;
    array[j] = temp;
  }
}