import { type Member } from '@/types/member';
import { useState, useMemo } from 'react';
import {
  Search,
  X,
  Users,
  AlertTriangle,
  LayoutGrid,
  Play,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { IconBadge } from '../ui/IconBadge';
import { PlayerNumber } from '../ui/PlayerNumber';
import { SelectTile } from '../ui/SelectTile';
import { CourtSelector } from '../ui/CourtSelector';

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
    <div className="space-y-4">
      <form onSubmit={onStart} className="">
        <div className="grid grid-cols-1 gap-4">
          {/* コート設定カード */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <IconBadge icon={LayoutGrid} size="sm" className="text-primary" />
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    コート設定
                  </h3>
                </div>
              </div>
            </div>
            <div className="bg-muted rounded-lg p-2">
              <CourtSelector courts={courts} setCourts={setCourts} size="sm" />
              {runnableCourts < courts && selected.length >= 4 && (
                <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1.5 rounded border border-amber-200">
                  参加者数により実際は{runnableCourts}コートで開始されます
                </div>
              )}
            </div>
          </Card>

          {/* 参加者選択 */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <IconBadge icon={Users} size="md" className="text-primary" />
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    ダブルス参加者
                  </h3>
                  <p className="text-xs text-muted-foreground">
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
                  <Search className="w-5 h-5 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="メンバー名で検索"
                  className="w-full pl-10 pr-4 py-3 border rounded-lg text-base min-h-[48px] border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  aria-label="メンバー検索"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 px-3 text-muted-foreground hover:text-foreground"
                    aria-label="検索をクリア"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* メンバーリスト */}
              <div className="rounded-xl border border-border bg-secondary">
                <div className="grid grid-cols-2 gap-2 p-2 max-h-80 overflow-auto">
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
                          size="sm"
                          className="w-full justify-start text-left"
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
                    <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
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
              variant="default"
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
                  ダブルス練習開始 ({selected.length}名)
                </span>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
