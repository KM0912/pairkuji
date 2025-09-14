import { type Member } from '@/types/member';
import { useState, useMemo } from 'react';
import { Search, X, Users, LayoutGrid, AlertTriangle } from 'lucide-react';

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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* 左カラム: コート数のみ */}
        <div className="md:col-span-2 space-y-6">
          {/* コート数カード */}
          <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <LayoutGrid className="h-4 w-4" />
                </span>
                <h3 className="text-base font-semibold text-slate-800">コート数</h3>
              </div>
            </div>
            <select
              value={courts}
              onChange={(e) => setCourts(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-base min-h-[48px] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors"
              aria-label="コート数を選択"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">同時に使用するコート数を選んでください。</p>
          </section>
        </div>

        {/* 右カラム: 参加者選択（確定済み + 選手一覧） */}
        <section className="md:col-span-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 border border-blue-200">
                <Users className="h-4 w-4" />
              </span>
              <h3 className="text-base font-semibold text-slate-800">参加者選択</h3>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              選択中 {selected.length} 名
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 確定済み参加者（同カード内） */}
            <div className="lg:col-span-1">
              <p className="text-xs text-slate-600 mb-2">確定済み</p>
              {selectedMembers.length > 0 ? (
                <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-xl p-3 min-h-[90px]">
                  <div className="flex flex-wrap gap-2">
                    {selectedMembers.map((member) => {
                      const playerNumber = selected.indexOf(member.id!) + 1;
                      return (
                        <div
                          key={member.id}
                          className="inline-flex items-center gap-1 bg-white border border-blue-300 rounded-full px-2 py-1 text-xs shadow-sm"
                          title={member.name}
                        >
                          <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full">
                            {playerNumber}
                          </span>
                          <span className="font-medium text-slate-800 max-w-[70px] truncate">
                            {member.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeParticipant(member.id!)}
                            className="p-0.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                            aria-label={`参加を取り消す: ${member.name}`}
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
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center min-h-[90px] flex items-center justify-center">
                  <p className="text-slate-500 text-sm">一覧から選手を選んで追加してください</p>
                </div>
              )}
            </div>

            {/* 選手一覧（同カード内） */}
            <div className="lg:col-span-2 lg:border-l lg:pl-4 border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-600">選手一覧</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 text-[11px]">
                  {filteredMembers.length} 名
                </span>
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
                  aria-label="選手検索"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-72 overflow-auto bg-slate-50 rounded-xl p-2 border border-slate-200">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => addParticipant(member.id!)}
                      className="flex items-center justify-center rounded-lg px-3 py-2 border text-center transition-all duration-200 min-h-[36px] active:scale-95 bg-white border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-sm text-sm"
                      aria-label={`参加者に追加: ${member.name}`}
                      title={member.name}
                    >
                      <span className="font-medium text-slate-800 truncate">{member.name}</span>
                    </button>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-slate-500 text-sm">
                    {searchTerm ? '検索条件に一致する選手がいません' : '選択可能な選手がいません'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50 disabled:from-slate-400 disabled:to-slate-400 font-semibold min-h-[48px] shadow-lg hover:shadow-xl transition-all duration-200 border"
          disabled={selected.length < 4}
        >
          {selected.length < 4 ? (
            <span className="inline-flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              4人以上選択してください
            </span>
          ) : (
            '練習を開始'
          )}
        </button>
      </div>
    </form>
  );
}
