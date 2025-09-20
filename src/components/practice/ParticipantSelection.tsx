import { type Member } from '@/types/member';
import { useState, useMemo } from 'react';
import {
  Search,
  X,
  Users,
  LayoutGrid,
  AlertTriangle,
  Minus,
  Plus,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { IconBadge } from '../ui/IconBadge';
import { PlayerNumber } from '../ui/PlayerNumber';
import { SelectTile } from '../ui/SelectTile';

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
  const [viewFilter, setViewFilter] = useState<
    'all' | 'selected' | 'unselected'
  >('all');
  const minToStart = 4;
  const runnableCourts = Math.min(courts, Math.floor(selected.length / 4));
  const needMore = Math.max(minToStart - selected.length, 0);

  const activeMembers = useMemo(
    () =>
      members
        .filter((m) => m.isActive)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [members]
  );
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const counts = useMemo(
    () => ({
      all: activeMembers.length,
      selected: selected.length,
      unselected: activeMembers.length - selected.length,
    }),
    [activeMembers.length, selected.length]
  );
  const visibleMembers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let list = activeMembers;
    if (viewFilter === 'selected')
      list = list.filter((m) => selectedSet.has(m.id!));
    if (viewFilter === 'unselected')
      list = list.filter((m) => !selectedSet.has(m.id!));
    if (term) list = list.filter((m) => m.name.toLowerCase().includes(term));
    return list;
  }, [activeMembers, viewFilter, selectedSet, searchTerm]);

  const addParticipant = (memberId: number) => {
    onToggleSelect(memberId);
  };

  const removeParticipant = (memberId: number) => {
    onToggleSelect(memberId);
  };

  return (
    <form onSubmit={onStart} className="">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* 左カラム: コート数のみ */}
        <div className="md:col-span-2 space-y-6">
          {/* コート数カード */}
          <Card as="section">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <IconBadge icon={LayoutGrid} size="md" />
                <h3 className="text-base font-semibold text-slate-800">
                  コート数
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={() => setCourts(Math.max(1, courts - 1))}
                className="w-auto px-3 py-2 text-slate-700"
                aria-label="コート数を減らす"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <div className="flex-1 text-center font-semibold text-slate-800 text-lg">
                {courts}
              </div>
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={() => setCourts(Math.min(10, courts + 1))}
                className="w-auto px-3 py-2 text-slate-700"
                aria-label="コート数を増やす"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>

        {/* 右カラム: 参加者選択（単一リスト + フィルタ） */}
        <Card as="section" className="md:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconBadge icon={Users} size="md" />
              <h3 className="text-base font-semibold text-slate-800">
                参加者選択
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            {/* フィルタ（セグメント） */}
            <div className="grid grid-cols-3 gap-2">
              <SelectTile
                size="sm"
                selected={viewFilter === 'all'}
                onClick={() => setViewFilter('all')}
                className="text-xs"
              >
                全員 {counts.all}
              </SelectTile>
              <SelectTile
                size="sm"
                selected={viewFilter === 'selected'}
                onClick={() => setViewFilter('selected')}
                className="text-xs"
              >
                参加 {counts.selected}
              </SelectTile>
              <SelectTile
                size="sm"
                selected={viewFilter === 'unselected'}
                onClick={() => setViewFilter('unselected')}
                className="text-xs"
              >
                未参加 {counts.unselected}
              </SelectTile>
            </div>

            {/* 検索 */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="名前で検索"
                className="w-full pl-10 pr-4 py-3 border rounded-lg text-base min-h-[48px] border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                aria-label="選手検索"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-600"
                  aria-label="検索をクリア"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* リスト */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-80 overflow-auto bg-slate-50 rounded-xl p-2 border border-slate-200">
              {visibleMembers.length > 0 ? (
                visibleMembers.map((member) => {
                  const isSelected = selectedSet.has(member.id!);
                  const order = isSelected
                    ? selected.indexOf(member.id!) + 1
                    : null;
                  return (
                    <SelectTile
                      key={member.id}
                      selected={isSelected}
                      onClick={() => onToggleSelect(member.id!)}
                      aria-label={`${isSelected ? '参加者から外す' : '参加者に追加'}: ${member.name}`}
                      title={member.name}
                      left={
                        isSelected ? (
                          <PlayerNumber
                            number={order ?? ''}
                            variant="neutral"
                            size="xs"
                          />
                        ) : undefined
                      }
                    >
                      {member.name}
                    </SelectTile>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-8 text-slate-500 text-sm">
                  {searchTerm
                    ? '検索条件に一致する選手がいません'
                    : '表示できる選手がいません'}
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="sticky bottom-2">
          <Button
            type="submit"
            variant="primary"
            disabled={selected.length < minToStart}
          >
            {selected.length < minToStart ? (
              <span className="inline-flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                あと {needMore} 人選択してください
              </span>
            ) : (
              '練習を開始'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
