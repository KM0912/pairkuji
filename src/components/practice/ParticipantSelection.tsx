import { type Member } from '@/types/member';
import { useState, useMemo } from 'react';

interface ParticipantSelectionProps {
  members: Member[];
  courts: number;
  setCourts: (courts: number) => void;
  selected: number[];
  onToggleSelect: (id: number) => void;
  onStart: (e: React.FormEvent) => void;
}

export function ParticipantSelection({
  members,
  courts,
  setCourts,
  selected,
  onToggleSelect,
  onStart,
}: ParticipantSelectionProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = useMemo(
    () =>
      members
        .filter(
          (m) =>
            m.isActive &&
            m.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [members, searchTerm]
  );

  return (
    <form
      onSubmit={onStart}
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg mb-8 space-y-6"
    >
      <div className="mb-4">
        <label className="block text-sm text-gray-700 mb-1">コート数</label>
        <select
          value={courts}
          onChange={(e) => setCourts(Number(e.target.value))}
          className="bg-white border border-slate-300 rounded-lg px-4 py-3 text-base min-h-[48px] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors"
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm text-gray-700">参加者を選択</label>
          <div className="text-sm text-gray-500">
            {selected.length} 名選択中
          </div>
        </div>
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="名前で検索"
            className="w-full pl-10 pr-4 py-3 border rounded-lg text-base min-h-[48px] border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-auto border rounded p-2">
          {filteredMembers.map((m) => {
            const isSelected = selected.includes(m.id!);
            const selectionIndex = selected.indexOf(m.id!);
            const playerNumber =
              selectionIndex !== -1 ? selectionIndex + 1 : null;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onToggleSelect(m.id!)}
                className={`flex items-center rounded-lg px-4 py-3 border-2 text-left transition-all duration-200 min-h-[48px] active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-50 to-emerald-50 border-blue-400 text-blue-700 shadow-md ring-1 ring-blue-200'
                    : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {playerNumber && (
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full shadow-sm">
                      {playerNumber}
                    </span>
                  )}
                  <span className="font-medium">{m.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50 disabled:from-slate-400 disabled:to-slate-400 font-semibold min-h-[48px] shadow-lg hover:shadow-xl transition-all duration-200 border"
          disabled={selected.length < 4}
        >
          {selected.length < 4 ? '⚠️ 4人以上選択してください' : '練習を開始'}
        </button>
      </div>
    </form>
  );
}
