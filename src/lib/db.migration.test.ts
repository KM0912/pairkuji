import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, expect, test } from 'vitest';

afterEach(async () => {
  await Dexie.delete('pairkuji');
});

test('v5の初期4名はv6でサンプルになる', async () => {
  await Dexie.delete('pairkuji');
  const legacy = new Dexie('pairkuji');
  legacy.version(5).stores({
    members: '++id, name, isActive, isDeleted, createdAt, updatedAt',
    practiceSettings: 'id, updatedAt',
    practicePlayers: 'memberId, playerNumber, status, createdAt',
    rounds: 'roundNo',
    pairStats: '++id, sessionId, lastUpdated',
    practiceSessions: '++id, startedAt, endedAt, *clubTags',
  });
  const createdAt = '2020-01-01T00:00:00.000Z';
  await legacy.open();
  await legacy.table('members').bulkAdd([
    { name: 'Aくん', isActive: true, isDeleted: false, createdAt, updatedAt: createdAt },
    { name: 'Bさん', isActive: true, isDeleted: false, createdAt, updatedAt: createdAt },
    { name: 'Cくん', isActive: true, isDeleted: false, createdAt, updatedAt: createdAt },
    { name: 'Dさん', isActive: true, isDeleted: false, createdAt, updatedAt: createdAt },
  ]);
  legacy.close();

  const { db } = await import('@/lib/db');
  db.close();
  await db.open();
  const members = await db.members.toArray();
  expect(members).toHaveLength(4);
  expect(members.every((member) => member.isSample === true)).toBe(true);
  db.close();
});
