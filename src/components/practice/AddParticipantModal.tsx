import { type Member } from '@/types/member';

interface AddParticipantModalProps {
  isOpen: boolean;
  availableMembers: Member[];
  onAddParticipant: (memberId: number) => Promise<void>;
  onClose: () => void;
}

export function AddParticipantModal({
  isOpen,
  availableMembers,
  onAddParticipant,
  onClose,
}: AddParticipantModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-sm mx-4">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">参加者を追加</h2>
          {availableMembers.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              追加できる選手がいません
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-auto">
              {availableMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onAddParticipant(m.id!)}
                  className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-3 pt-4 mt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}