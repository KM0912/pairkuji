import { describe, expect, test } from 'vitest';
import { formatBackupStamp } from './downloadJson';

describe('formatBackupStamp', () => {
  test('日本時間の年月日時分にする', () => {
    expect(formatBackupStamp(new Date('2026-01-01T15:00:00Z'))).toBe('20260102-000000');
  });
});
