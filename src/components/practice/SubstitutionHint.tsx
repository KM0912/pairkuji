import { type Member } from '@/types/member';
import { type PracticePlayer } from '@/types/practice';

interface SubstitutionHintProps {
  substituting: number | null;
  memberMap: Map<number, Member>;
  playerMap: Map<number, PracticePlayer>;
}

export function SubstitutionHint({
  substituting,
  memberMap,
  playerMap,
}: SubstitutionHintProps) {
  if (!substituting) return null;

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
      <div className="flex items-center gap-2 text-sm">
        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-blue-600 bg-white rounded-full">
          {playerMap.get(substituting)?.playerNumber}
        </span>
        <span>{memberMap.get(substituting)?.name}を選択中</span>
      </div>
    </div>
  );
}