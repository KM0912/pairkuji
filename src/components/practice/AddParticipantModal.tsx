import { useState } from 'react';
import { type Member } from '@/types/member';

interface AddParticipantModalProps {
  isOpen: boolean;
  availableMembers: Member[];
  onAddParticipants: (memberIds: number[]) => Promise<void>;
  onClose: () => void;
}

export function AddParticipantModal({
  isOpen,
  availableMembers,
  onAddParticipants,
  onClose,
}: AddParticipantModalProps) {
  if (!isOpen) return null;

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggle = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAdd = async () => {
    if (selectedIds.length === 0) return;
    await onAddParticipants(selectedIds);
    setSelectedIds([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-sm mx-4">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-2">参加者を追加</h2>
          {availableMembers.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              追加できる選手がいません
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-auto">
              {availableMembers.map((m) => {
                const id = m.id!;
                const checked = selectedIds.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle(id)}
                    aria-pressed={checked}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-150 ${
                      checked
                        ? 'bg-gradient-to-r from-blue-50 to-emerald-50 border-blue-200 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                    title={m.name}
                  >
                    <span className="flex-1 text-left font-medium text-slate-800 truncate">
                      {m.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex items-center justify-between text-sm text-gray-600 mt-3">
            <div>選択中: {selectedIds.length} 名</div>
            {availableMembers.length > 0 && (
              <button
                className="underline hover:text-gray-800"
                onClick={() =>
                  setSelectedIds(
                    selectedIds.length === availableMembers.length
                      ? []
                      : availableMembers.map((m) => m.id!)
                  )
                }
              >
                {selectedIds.length === availableMembers.length
                  ? '全て解除'
                  : '全て選択'}
              </button>
            )}
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-600 mb-4">
              途中参加者は、最も試合数が少ない選手(出場可)と同じ試合数として追加されます。
              組み合わせを公平にするためです。
            </p>
          </div>
          <div className="flex gap-3 pt-4 mt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleAdd}
              disabled={selectedIds.length === 0}
              className="flex-1 px-4 py-2 rounded-xl text-white bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50 disabled:from-slate-400 disabled:to-slate-400 shadow-sm"
            >
              {selectedIds.length > 0
                ? `追加する (${selectedIds.length})`
                : '追加する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
