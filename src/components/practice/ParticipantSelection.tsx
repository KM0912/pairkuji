import { type Member } from '@/types/member';
import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';

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
            !selected.includes(m.id!) &&
            m.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [members, searchTerm, selected]
  );

  const selectedMembers = useMemo(
    () =>
      selected
        .map((id) => members.find((m) => m.id === id))
        .filter((m): m is Member => m !== undefined),
    [selected, members]
  );

  const addParticipant = (memberId: number) => {
    onToggleSelect(memberId);
  };

  const removeParticipant = (memberId: number) => {
    onToggleSelect(memberId);
  };

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

      {/* 確定済み参加者エリア */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">確定済み参加者</h3>
          <div className="text-sm text-gray-500">
            {selected.length} 名
          </div>
        </div>
        
        {selectedMembers.length > 0 ? (
          <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border-2 border-blue-200 rounded-xl p-4 min-h-[100px]">
            <div className="flex flex-wrap gap-2">
              {selectedMembers.map((member) => {
                const playerNumber = selected.indexOf(member.id!) + 1;
                return (
                  <div
                    key={member.id}
                    className="inline-flex items-center gap-1 bg-white border border-blue-300 rounded-full px-2 py-1 text-xs shadow-sm"
                  >
                    <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full">
                      {playerNumber}
                    </span>
                    <span className="font-medium text-gray-800 max-w-[60px] truncate" title={member.name}>
                      {member.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeParticipant(member.id!)}
                      className="p-0.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                      title="参加を取り消す"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center min-h-[100px] flex items-center justify-center">
            <p className="text-gray-500">下から選手を選んで参加者を追加してください</p>
          </div>
        )}
      </div>

      {/* 選手一覧エリア */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">選手一覧</h3>
          <div className="text-sm text-gray-500">
            {filteredMembers.length} 名
          </div>
        </div>
        
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="名前で検索"
            className="w-full pl-10 pr-4 py-3 border rounded-lg text-base min-h-[48px] border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          />
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-64 overflow-auto bg-white border rounded-xl p-2">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => addParticipant(member.id!)}
                className="flex items-center justify-center rounded-lg px-3 py-2 border text-center transition-all duration-200 min-h-[36px] active:scale-95 bg-white border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-sm text-sm"
              >
                <span className="font-medium text-gray-800 truncate" title={member.name}>
                  {member.name}
                </span>
              </button>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              {searchTerm ? '検索条件に一致する選手がいません' : '選択可能な選手がいません'}
            </div>
          )}
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
