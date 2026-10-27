import { db } from '@/lib/db';
import { saveSafetySnapshot } from '@/lib/safetyBackup';
import type { Member } from '@/types/member';
import type { PracticePlayer, PracticeSettings } from '@/types/practice';
import type { PracticeSession, SessionParticipant } from '@/types/practiceSession';
import type { CourtMatch, MatchResult, Round } from '@/types/round';

export const BACKUP_APP = 'pairkuji';
export const BACKUP_VERSION = 1;

const MAX_MEMBERS = 5000;
const MAX_SESSIONS = 2000;
const MAX_ROUNDS = 500;
const MAX_NAME_LENGTH = 100;

export interface PairkujiBackup {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  members: Member[];
  practiceSettings: PracticeSettings | null;
  practicePlayers: PracticePlayer[];
  rounds: Round[];
  practiceSessions: PracticeSession[];
}

export type BackupValidation =
  | { ok: true; data: PairkujiBackup }
  | { ok: false; errors: string[] };

export type ImportMode = 'replace' | 'merge';

export const DELETED_MEMBER_NAME = '削除済みの選手';

/** プレビューと上書き完了で揃える人数。補完した削除済みは数えない。 */
export function countRosterMembers(members: Member[]): number {
  return members.filter((member) => !member.isDeleted).length;
}

export interface MemberMergePlan {
  matches: Array<{ incomingId: number; existingId: number }>;
  creates: Member[];
  aliases: Array<{ incomingId: number; createIncomingId: number }>;
}

export interface ImportSummary {
  addedMembers: number;
  addedSessions: number;
  practiceImported: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonEmptyString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => isFiniteNumber(item));
}

function pushError(errors: string[], message: string) {
  if (errors.length < 20) errors.push(message);
}

function parseMatchResult(value: unknown): MatchResult | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === 'pairA' || value === 'pairB') return value;
  return undefined;
}

function parseCourt(value: unknown, label: string, errors: string[]): CourtMatch | null {
  if (!isRecord(value)) {
    pushError(errors, `${label}の形式が不正です`);
    return null;
  }
  if (!isFiniteNumber(value.courtNo)) {
    pushError(errors, `${label}のコート番号が不正です`);
    return null;
  }
  if (!Array.isArray(value.pairA) || value.pairA.length !== 2 || !isNumberArray(value.pairA)) {
    pushError(errors, `${label}の左ペアが不正です`);
    return null;
  }
  if (!Array.isArray(value.pairB) || value.pairB.length !== 2 || !isNumberArray(value.pairB)) {
    pushError(errors, `${label}の右ペアが不正です`);
    return null;
  }
  const result = parseMatchResult(value.result);
  if (value.result !== undefined && result === undefined && value.result !== null) {
    pushError(errors, `${label}の勝敗が不正です`);
    return null;
  }
  const pairA0 = value.pairA[0];
  const pairA1 = value.pairA[1];
  const pairB0 = value.pairB[0];
  const pairB1 = value.pairB[1];
  if (
    pairA0 === undefined ||
    pairA1 === undefined ||
    pairB0 === undefined ||
    pairB1 === undefined
  ) {
    pushError(errors, `${label}のペアが不正です`);
    return null;
  }
  return {
    courtNo: value.courtNo,
    pairA: [pairA0, pairA1],
    pairB: [pairB0, pairB1],
    result,
  };
}

function parseRound(value: unknown, label: string, errors: string[]): Round | null {
  if (!isRecord(value)) {
    pushError(errors, `${label}の形式が不正です`);
    return null;
  }
  if (!isFiniteNumber(value.roundNo)) {
    pushError(errors, `${label}のラウンド番号が不正です`);
    return null;
  }
  if (!isNumberArray(value.rests)) {
    pushError(errors, `${label}の休憩者一覧が不正です`);
    return null;
  }
  if (!Array.isArray(value.courts)) {
    pushError(errors, `${label}のコート一覧が不正です`);
    return null;
  }
  const courts: CourtMatch[] = [];
  for (let index = 0; index < value.courts.length; index += 1) {
    const court = parseCourt(value.courts[index], `${label}のコート${index + 1}`, errors);
    if (!court) return null;
    courts.push(court);
  }
  let breakMemberIds: number[] | undefined;
  if (value.breakMemberIds !== undefined) {
    if (!isNumberArray(value.breakMemberIds)) {
      pushError(errors, `${label}の休憩指定が不正です`);
      return null;
    }
    breakMemberIds = value.breakMemberIds;
  }
  return {
    roundNo: value.roundNo,
    courts,
    rests: value.rests,
    ...(breakMemberIds ? { breakMemberIds } : {}),
  };
}

function parseMember(value: unknown, index: number, errors: string[]): Member | null {
  const label = `選手${index + 1}`;
  if (!isRecord(value)) {
    pushError(errors, `${label}の形式が不正です`);
    return null;
  }
  if (!isFiniteNumber(value.id)) {
    pushError(errors, `${label}のIDが不正です`);
    return null;
  }
  if (!isNonEmptyString(value.name, MAX_NAME_LENGTH)) {
    pushError(errors, `${label}の名前が不正です`);
    return null;
  }
  if (!isBoolean(value.isActive) || !isBoolean(value.isDeleted)) {
    pushError(errors, `${label}の状態が不正です`);
    return null;
  }
  if (typeof value.createdAt !== 'string' || typeof value.updatedAt !== 'string') {
    pushError(errors, `${label}の日時が不正です`);
    return null;
  }
  if (value.isSample !== undefined && !isBoolean(value.isSample)) {
    pushError(errors, `${label}のサンプルフラグが不正です`);
    return null;
  }
  return {
    id: value.id,
    name: value.name.trim(),
    isActive: value.isActive,
    isDeleted: value.isDeleted,
    isSample: value.isSample,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function parsePlayer(value: unknown, index: number, errors: string[]): PracticePlayer | null {
  const label = `参加選手${index + 1}`;
  if (!isRecord(value)) {
    pushError(errors, `${label}の形式が不正です`);
    return null;
  }
  if (!isFiniteNumber(value.memberId) || !isFiniteNumber(value.playerNumber)) {
    pushError(errors, `${label}の番号が不正です`);
    return null;
  }
  if (value.status !== 'active' && value.status !== 'rest') {
    pushError(errors, `${label}の状態が不正です`);
    return null;
  }
  if (typeof value.createdAt !== 'string') {
    pushError(errors, `${label}の日時が不正です`);
    return null;
  }
  if (value.playedOffset !== undefined && !isFiniteNumber(value.playedOffset)) {
    pushError(errors, `${label}の試合数補正が不正です`);
    return null;
  }
  return {
    memberId: value.memberId,
    playerNumber: value.playerNumber,
    status: value.status,
    createdAt: value.createdAt,
    playedOffset: value.playedOffset,
  };
}

function parseParticipant(
  value: unknown,
  label: string,
  errors: string[]
): SessionParticipant | null {
  if (!isRecord(value) || !isFiniteNumber(value.memberId) || !isFiniteNumber(value.playerNumber)) {
    pushError(errors, `${label}の出場番号が不正です`);
    return null;
  }
  return { memberId: value.memberId, playerNumber: value.playerNumber };
}

function parseSession(value: unknown, index: number, errors: string[]): PracticeSession | null {
  const label = `履歴${index + 1}`;
  if (!isRecord(value)) {
    pushError(errors, `${label}の形式が不正です`);
    return null;
  }
  if (typeof value.startedAt !== 'string' || typeof value.endedAt !== 'string') {
    pushError(errors, `${label}の日時が不正です`);
    return null;
  }
  if (!isFiniteNumber(value.courts) || !isNumberArray(value.playerIds)) {
    pushError(errors, `${label}の参加者情報が不正です`);
    return null;
  }
  if (!Array.isArray(value.rounds) || value.rounds.length > MAX_ROUNDS) {
    pushError(errors, `${label}のラウンドが不正です`);
    return null;
  }
  const rounds: Round[] = [];
  for (let roundIndex = 0; roundIndex < value.rounds.length; roundIndex += 1) {
    const round = parseRound(value.rounds[roundIndex], `${label}のラウンド${roundIndex + 1}`, errors);
    if (!round) return null;
    rounds.push(round);
  }
  if (value.clubTags !== undefined && !isStringArray(value.clubTags)) {
    pushError(errors, `${label}のクラブが不正です`);
    return null;
  }
  let participants: SessionParticipant[] | undefined;
  if (value.participants !== undefined) {
    if (!Array.isArray(value.participants)) {
      pushError(errors, `${label}の出場番号が不正です`);
      return null;
    }
    participants = [];
    for (let participantIndex = 0; participantIndex < value.participants.length; participantIndex += 1) {
      const participant = parseParticipant(
        value.participants[participantIndex],
        label,
        errors
      );
      if (!participant) return null;
      participants.push(participant);
    }
  }
  return {
    id: isFiniteNumber(value.id) ? value.id : undefined,
    startedAt: value.startedAt,
    endedAt: value.endedAt,
    courts: value.courts,
    playerIds: value.playerIds,
    rounds,
    clubTags: value.clubTags,
    participants,
  };
}

function parseSettings(value: unknown, errors: string[]): PracticeSettings | null {
  if (!isRecord(value)) {
    pushError(errors, '練習設定の形式が不正です');
    return null;
  }
  if (!isFiniteNumber(value.courts) || !isFiniteNumber(value.currentRound)) {
    pushError(errors, '練習設定のコート数またはラウンドが不正です');
    return null;
  }
  if (value.clubTags !== undefined && !isStringArray(value.clubTags)) {
    pushError(errors, '練習設定のクラブが不正です');
    return null;
  }
  return {
    id: 1,
    courts: value.courts,
    currentRound: value.currentRound,
    startedAt: typeof value.startedAt === 'string' ? value.startedAt : null,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(),
    clubTags: value.clubTags,
  };
}

export function validateBackup(input: unknown): BackupValidation {
  const errors: string[] = [];
  if (!isRecord(input)) {
    return { ok: false, errors: ['ファイルの中身がJSONオブジェクトではありません'] };
  }
  if (input.app !== BACKUP_APP) {
    return { ok: false, errors: ['ペアくじのバックアップファイルではありません'] };
  }
  if (input.version !== BACKUP_VERSION) {
    return { ok: false, errors: ['対応していないバックアップのバージョンです'] };
  }
  if (!Array.isArray(input.members) || input.members.length > MAX_MEMBERS) {
    pushError(errors, '選手一覧が不正です');
  }
  if (!Array.isArray(input.practiceSessions) || input.practiceSessions.length > MAX_SESSIONS) {
    pushError(errors, '履歴一覧が不正です');
  }
  if (!Array.isArray(input.practicePlayers)) {
    pushError(errors, '参加選手一覧が不正です');
  }
  if (!Array.isArray(input.rounds) || input.rounds.length > MAX_ROUNDS) {
    pushError(errors, '進行中のラウンドが不正です');
  }
  if (input.practiceSettings !== null && input.practiceSettings !== undefined && !isRecord(input.practiceSettings)) {
    pushError(errors, '練習設定の形式が不正です');
  }
  if (errors.length > 0) return { ok: false, errors };

  const members: Member[] = [];
  for (let index = 0; index < (input.members as unknown[]).length; index += 1) {
    const member = parseMember((input.members as unknown[])[index], index, errors);
    if (!member) return { ok: false, errors };
    members.push(member);
  }

  const practiceSessions: PracticeSession[] = [];
  for (let index = 0; index < (input.practiceSessions as unknown[]).length; index += 1) {
    const session = parseSession((input.practiceSessions as unknown[])[index], index, errors);
    if (!session) return { ok: false, errors };
    practiceSessions.push(session);
  }

  const practicePlayers: PracticePlayer[] = [];
  for (let index = 0; index < (input.practicePlayers as unknown[]).length; index += 1) {
    const player = parsePlayer((input.practicePlayers as unknown[])[index], index, errors);
    if (!player) return { ok: false, errors };
    practicePlayers.push(player);
  }

  const rounds: Round[] = [];
  for (let index = 0; index < (input.rounds as unknown[]).length; index += 1) {
    const round = parseRound((input.rounds as unknown[])[index], `進行中ラウンド${index + 1}`, errors);
    if (!round) return { ok: false, errors };
    rounds.push(round);
  }

  const practiceSettings =
    input.practiceSettings == null
      ? null
      : parseSettings(input.practiceSettings, errors);
  if (input.practiceSettings != null && !practiceSettings) {
    return { ok: false, errors };
  }

  const memberIds = new Set<number>();
  let duplicateMemberId = false;
  for (const member of members) {
    if (member.id == null) continue;
    if (memberIds.has(member.id)) duplicateMemberId = true;
    memberIds.add(member.id);
  }
  if (duplicateMemberId) pushError(errors, '同じ選手IDが重複しています');

  const sessionIds = new Set<number>();
  let duplicateSessionId = false;
  for (const session of practiceSessions) {
    if (session.id == null) continue;
    if (sessionIds.has(session.id)) duplicateSessionId = true;
    sessionIds.add(session.id);
  }
  if (duplicateSessionId) pushError(errors, '同じ履歴IDが重複しています');

  const playerIds = new Set<number>();
  const playerNumbers = new Set<number>();
  let duplicatePlayerId = false;
  let duplicatePlayerNumber = false;
  let duplicateParticipant = false;
  for (const player of practicePlayers) {
    if (playerIds.has(player.memberId)) duplicatePlayerId = true;
    playerIds.add(player.memberId);
    if (playerNumbers.has(player.playerNumber)) duplicatePlayerNumber = true;
    playerNumbers.add(player.playerNumber);
  }
  if (duplicatePlayerId) pushError(errors, '参加者が重複しています');

  for (const session of practiceSessions) {
    const numbers = new Set<number>();
    const participantIds = new Set<number>();
    for (const participant of session.participants ?? []) {
      if (numbers.has(participant.playerNumber)) duplicatePlayerNumber = true;
      if (participantIds.has(participant.memberId)) duplicateParticipant = true;
      numbers.add(participant.playerNumber);
      participantIds.add(participant.memberId);
    }
  }
  if (duplicateParticipant) pushError(errors, '参加者が重複しています');
  if (duplicatePlayerNumber) pushError(errors, '出場番号が重複しています');

  const referenced = new Set<number>();
  const addRoundIds = (round: Round) => {
    for (const id of round.rests) referenced.add(id);
    for (const court of round.courts) {
      referenced.add(court.pairA[0]);
      referenced.add(court.pairA[1]);
      referenced.add(court.pairB[0]);
      referenced.add(court.pairB[1]);
    }
  };
  for (const player of practicePlayers) referenced.add(player.memberId);
  for (const round of rounds) addRoundIds(round);
  for (const session of practiceSessions) {
    for (const id of session.playerIds) referenced.add(id);
    for (const participant of session.participants ?? []) referenced.add(participant.memberId);
    for (const round of session.rounds) addRoundIds(round);
  }
  const exportedAt = typeof input.exportedAt === 'string' ? input.exportedAt : new Date().toISOString();
  for (const id of Array.from(referenced)) {
    if (memberIds.has(id)) continue;
    members.push({
      id,
      name: `${DELETED_MEMBER_NAME} #${id}`,
      isActive: false,
      isDeleted: true,
      createdAt: exportedAt,
      updatedAt: exportedAt,
    });
    memberIds.add(id);
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      app: BACKUP_APP,
      version: BACKUP_VERSION,
      exportedAt,
      members,
      practiceSettings,
      practicePlayers,
      rounds,
      practiceSessions,
    },
  };
}

export function planMemberMerge(existing: Member[], incoming: Member[]): MemberMergePlan {
  const byName = new Map<string, Member>();
  for (const member of existing) {
    if (member.isDeleted || member.id == null) continue;
    const key = member.name.trim();
    if (!byName.has(key)) byName.set(key, member);
  }

  const matches: MemberMergePlan['matches'] = [];
  const creates: Member[] = [];
  const aliases: MemberMergePlan['aliases'] = [];
  const pendingNameToIncomingId = new Map<string, number>();
  const pendingDeletedName = new Map<string, number>();

  for (const member of incoming) {
    if (member.isDeleted) {
      const key = member.name.trim();
      const sameDeleted = existing.find(
        (item) => item.isDeleted && item.id != null && item.name.trim() === key
      );
      if (sameDeleted?.id != null) {
        matches.push({ incomingId: member.id, existingId: sameDeleted.id });
        continue;
      }
      const pendingId = pendingDeletedName.get(key);
      if (pendingId != null) {
        aliases.push({ incomingId: member.id, createIncomingId: pendingId });
        continue;
      }
      creates.push(member);
      pendingDeletedName.set(key, member.id);
      continue;
    }
    const key = member.name.trim();
    const found = byName.get(key);
    if (found?.id != null) {
      matches.push({ incomingId: member.id, existingId: found.id });
      continue;
    }
    const pendingId = pendingNameToIncomingId.get(key);
    if (pendingId != null) {
      aliases.push({ incomingId: member.id, createIncomingId: pendingId });
      continue;
    }
    creates.push(member);
    pendingNameToIncomingId.set(key, member.id);
  }

  return { matches, creates, aliases };
}

export function duplicateMemberNames(members: Member[]): string[] {
  const counts = new Map<string, number>();
  for (const member of members) {
    if (member.isDeleted) continue;
    const key = member.name.trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([name]) => name);
}

/** 名前の重複がこの端末側か、読み込むファイル側か。 */
export function nameMergeConflicts(
  existing: Member[],
  incoming: Member[]
): { local: string[]; file: string[] } {
  return {
    local: duplicateMemberNames(existing),
    file: duplicateMemberNames(incoming),
  };
}

export function formatNameMergeConflict(conflicts: {
  local: string[];
  file: string[];
}): string {
  const parts: string[] = [];
  if (conflicts.local.length > 0) {
    parts.push(
      `この端末に同じ名前が2人以上います（${conflicts.local.join('、')}）`
    );
  }
  if (conflicts.file.length > 0) {
    parts.push(
      `読み込むファイル（書き出した端末）に同じ名前が2人います（${conflicts.file.join('、')}）`
    );
  }
  return `${parts.join('。')}。重複している側の名前を変えてから、もう一度統合してください`;
}

export function buildMemberIdMap(
  plan: MemberMergePlan,
  createdIds: Map<number, number>
): Map<number, number> {
  const idMap = new Map<number, number>();
  for (const match of plan.matches) {
    idMap.set(match.incomingId, match.existingId);
  }
  createdIds.forEach((newId, incomingId) => {
    idMap.set(incomingId, newId);
  });
  for (const alias of plan.aliases) {
    const mapped = idMap.get(alias.createIncomingId);
    if (mapped != null) idMap.set(alias.incomingId, mapped);
  }
  return idMap;
}

function mapId(id: number, idMap: Map<number, number>): number {
  const mapped = idMap.get(id);
  if (mapped == null) {
    throw new Error(`名簿にない選手IDです: ${id}`);
  }
  return mapped;
}

function remapPair(
  pair: [number, number],
  idMap: Map<number, number>
): [number, number] | null {
  const first = pair[0];
  const second = pair[1];
  const mapped: [number, number] = [mapId(first, idMap), mapId(second, idMap)];
  if (mapped[0] === mapped[1]) return null;
  return mapped;
}

export function remapRound(round: Round, idMap: Map<number, number>): Round {
  const courts: CourtMatch[] = [];
  for (const court of round.courts) {
    const pairA = remapPair(court.pairA, idMap);
    const pairB = remapPair(court.pairB, idMap);
    if (!pairA || !pairB) continue;
    const players = new Set([...pairA, ...pairB]);
    if (players.size !== 4) continue;
    courts.push({ ...court, pairA, pairB });
  }
  const { breakMemberIds, ...rest } = round;
  return {
    ...rest,
    courts,
    rests: round.rests.map((id) => mapId(id, idMap)),
    ...(breakMemberIds
      ? { breakMemberIds: breakMemberIds.map((id) => mapId(id, idMap)) }
      : {}),
  };
}

export function remapSession(
  session: PracticeSession,
  idMap: Map<number, number>
): PracticeSession {
  return {
    ...session,
    id: undefined,
    playerIds: session.playerIds.map((id) => mapId(id, idMap)),
    participants: session.participants?.map((participant) => ({
      ...participant,
      memberId: mapId(participant.memberId, idMap),
    })),
    rounds: session.rounds.map((round) => remapRound(round, idMap)),
  };
}

export function sessionIdentity(session: PracticeSession): string {
  const ids = [...session.playerIds].sort((a, b) => a - b).join(',');
  return `${session.startedAt}|${session.endedAt}|${ids}|${session.rounds.length}`;
}

export async function collectBackup(): Promise<PairkujiBackup> {
  const [members, practiceSettings, practicePlayers, rounds, practiceSessions] =
    await Promise.all([
      db.members.toArray(),
      db.practiceSettings.get(1),
      db.practicePlayers.toArray(),
      db.rounds.orderBy('roundNo').toArray(),
      db.practiceSessions.toArray(),
    ]);

  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    members,
    practiceSettings: practiceSettings ?? null,
    practicePlayers,
    rounds,
    practiceSessions,
  };
}

function withoutId<T extends { id?: number }>(value: T): Omit<T, 'id'> {
  const copy = { ...value };
  delete copy.id;
  return copy;
}

export async function applyBackup(
  data: PairkujiBackup,
  mode: ImportMode
): Promise<ImportSummary> {
  if (mode === 'replace') {
    const current = await collectBackup();
    await saveSafetySnapshot(current);
    await db.transaction(
      'rw',
      [
        db.members,
        db.practiceSettings,
        db.practicePlayers,
        db.rounds,
        db.practiceSessions,
      ],
      async () => {
        await db.members.clear();
        await db.practiceSettings.clear();
        await db.practicePlayers.clear();
        await db.rounds.clear();
        await db.practiceSessions.clear();
        if (data.members.length > 0) await db.members.bulkPut(data.members);
        if (data.practiceSettings) await db.practiceSettings.put(data.practiceSettings);
        if (data.practicePlayers.length > 0) {
          await db.practicePlayers.bulkPut(data.practicePlayers);
        }
        if (data.rounds.length > 0) await db.rounds.bulkPut(data.rounds);
        if (data.practiceSessions.length > 0) {
          await db.practiceSessions.bulkPut(data.practiceSessions);
        }
      }
    );
    return {
      addedMembers: countRosterMembers(data.members),
      addedSessions: data.practiceSessions.length,
      practiceImported: data.practiceSettings != null,
    };
  }

  return db.transaction(
    'rw',
    [
      db.members,
      db.practiceSessions,
      db.practiceSettings,
      db.practicePlayers,
      db.rounds,
    ],
    async () => {
      const existingMembers = await db.members.toArray();
      const existingSessions = await db.practiceSessions.toArray();
      const existingSettings = await db.practiceSettings.get(1);
      const conflicts = nameMergeConflicts(existingMembers, data.members);
      if (conflicts.local.length > 0 || conflicts.file.length > 0) {
        throw new Error(formatNameMergeConflict(conflicts));
      }
      const plan = planMemberMerge(existingMembers, data.members);
      const createdIds = new Map<number, number>();

      for (const member of plan.creates) {
        const newId = await db.members.add(withoutId(member) as Member);
        createdIds.set(member.id, Number(newId));
      }

      const idMap = buildMemberIdMap(plan, createdIds);
      const knownSessions = new Set(existingSessions.map((session) => sessionIdentity(session)));
      const sessionsToAdd: PracticeSession[] = [];
      for (const session of data.practiceSessions) {
        const remapped = remapSession(session, idMap);
        const identity = sessionIdentity(remapped);
        if (knownSessions.has(identity)) continue;
        knownSessions.add(identity);
        sessionsToAdd.push(remapped);
      }

      if (sessionsToAdd.length > 0) {
        await db.practiceSessions.bulkAdd(sessionsToAdd.map((session) => withoutId(session)));
      }

      const practiceImported = existingSettings == null && data.practiceSettings != null;
      if (practiceImported && data.practiceSettings) {
        const players: PracticePlayer[] = [];
        const seen = new Set<number>();
        for (const player of data.practicePlayers) {
          const memberId = mapId(player.memberId, idMap);
          if (seen.has(memberId)) continue;
          seen.add(memberId);
          players.push({ ...player, memberId });
        }
        await db.practiceSettings.put(data.practiceSettings);
        if (players.length > 0) await db.practicePlayers.bulkPut(players);
        const rounds = data.rounds.map((round) => remapRound(round, idMap));
        if (rounds.length > 0) await db.rounds.bulkPut(rounds);
      }

      return {
        addedMembers: plan.creates.length,
        addedSessions: sessionsToAdd.length,
        practiceImported,
      };
    }
  );
}
