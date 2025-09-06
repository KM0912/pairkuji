export interface PracticeSettings {
  courts: number;
  currentRound: number;
  startedAt: string | null;
  updatedAt: string;
}

export type UpdatePracticeSettingsData = Partial<Omit<PracticeSettings, 'updatedAt'>>;