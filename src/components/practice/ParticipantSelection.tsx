import { type Member } from '@/types/member';
import { useState, useMemo } from 'react';
import {
  Search,
  X,
  Users,
  AlertTriangle,
  Target,
  Play,
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

  return (
    <form onSubmit={onStart} className="">
      <div className="grid grid-cols-1 gap-6">
        {/* コート設定カード */}
        <Card as="section">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconBadge
                icon={Target}
                size="md"
                className="bg-emerald-100 text-emerald-600"
              />
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  コート設定
                </h3>
                <p className="text-xs text-slate-500">使用するコート数</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-100 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={() => setCourts(Math.max(1, courts - 1))}
                className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 shadow-sm border-slate-200 flex items-center justify-center"
                aria-label="コート数を減らす"
              >
                <span className="text-lg font-bold text-slate-600">−</span>
              </Button>
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold text-slate-800">
                  {courts}
                </div>
                <div className="text-xs text-slate-600">コート</div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={() => setCourts(Math.min(10, courts + 1))}
                className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 shadow-sm border-slate-200 flex items-center justify-center"
                aria-label="コート数を増やす"
              >
                <span className="text-lg font-bold text-slate-600">＋</span>
              </Button>
            </div>
            {runnableCourts < courts && selected.length >= 4 && (
              <div className="mt-3 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                参加者数により実際は{runnableCourts}コートで開始されます
              </div>
            )}
          </div>
        </Card>

        {/* 参加者選択 */}
        <Card as="section">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconBadge
                icon={Users}
                size="md"
                className="bg-blue-100 text-blue-600"
              />
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  ダブルス参加者
                </h3>
                <p className="text-xs text-slate-500">
                  {selected.length}名選択中 • 最低4名必要
                </p>
              </div>
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
                全メンバー {counts.all}
              </SelectTile>
              <SelectTile
                size="sm"
                selected={viewFilter === 'selected'}
                onClick={() => setViewFilter('selected')}
                className="text-xs"
              >
                出場予定 {counts.selected}
              </SelectTile>
              <SelectTile
                size="sm"
                selected={viewFilter === 'unselected'}
                onClick={() => setViewFilter('unselected')}
                className="text-xs"
              >
                未選択 {counts.unselected}
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
                placeholder="メンバー名で検索"
                className="w-full pl-10 pr-4 py-3 border rounded-lg text-base min-h-[48px] border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                aria-label="メンバー検索"
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

            {/* メンバーリスト */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl p-2 border border-slate-200">
              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-auto">
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
                        aria-label={`${isSelected ? 'ダブルス参加者から外す' : 'ダブルス参加者に追加'}: ${member.name}`}
                        title={member.name}
                        className={
                          isSelected
                            ? 'ring-2 ring-blue-300 bg-blue-50 m-1'
                            : 'm-1'
                        }
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
                      ? '検索条件に一致するメンバーがいません'
                      : '表示できるメンバーがいません'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="sticky bottom-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full text-lg font-bold shadow-2xl"
            disabled={selected.length < minToStart}
          >
            {selected.length < minToStart ? (
              <span className="inline-flex items-center gap-3">
                <AlertTriangle className="w-6 h-6" />
                あと {needMore} 名選択してください
              </span>
            ) : (
              <span className="inline-flex items-center gap-3">
                <Play className="w-6 h-6" />
                🏸 ダブルス練習開始 ({selected.length}名)
              </span>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
