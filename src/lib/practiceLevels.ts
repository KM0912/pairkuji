import type { PracticeLevel } from '@/types/practice';

export const PRACTICE_LEVELS: readonly PracticeLevel[] = ['C', 'B', 'A'];

export const PRACTICE_LEVEL_LABELS: Record<PracticeLevel, string> = {
  A: '高め',
  B: '中間',
  C: '低め',
};

export const PRACTICE_LEVEL_CLASSES: Record<PracticeLevel, string> = {
  A: 'practice-level-a',
  B: 'practice-level-b',
  C: 'practice-level-c',
};

export function isPracticeLevel(value: unknown): value is PracticeLevel {
  return value === 'A' || value === 'B' || value === 'C';
}

export function practiceLevelLabel(level: PracticeLevel | undefined): string {
  return level ? `レベル${level}（${PRACTICE_LEVEL_LABELS[level]}）` : 'レベル未設定';
}

export function practiceLevelCardClass(level: PracticeLevel | undefined): string {
  return level ? `practice-level-card ${PRACTICE_LEVEL_CLASSES[level]}` : '';
}
