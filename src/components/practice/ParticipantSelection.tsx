import { type Member } from '@/types/member';
import { useState, useMemo } from 'react';
import { Search, X, Users, AlertTriangle, Play, CheckCircle2 } from 'lucide-react';
import { PiCourtBasketball } from 'react-icons/pi';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
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
    <div className="space-y-6 pb-20">
      {/* ヘッダー */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          練習を開始
        </h1>
        <p className="text-sm text-muted-foreground">
          参加者とコート数を設定して、公平な組み合わせを生成します
        </p>
      </div>

      <form onSubmit={onStart} className="space-y-6">
        {/* ステップ1: コート設定 */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <IconBadge icon={PiCourtBasketball} className="text-primary" />
                  <span>コート数を設定</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  使用するコート数を選択してください
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-xl p-4 border border-border">
              <CourtSelector
                courts={courts}
                setCourts={setCourts}
                size="md"
              />
              {runnableCourts < courts && selected.length >= 4 && (
                <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="text-xs">
                      <div className="font-medium mb-1">注意</div>
                      参加者数により実際は <span className="font-bold">{runnableCourts}</span> コートで開始されます
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ステップ2: 参加者選択 */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">2</span>
              </div>
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <IconBadge icon={Users} size="md" className="text-primary" />
                  <span>参加者を選択</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  {selected.length}名選択中 • 最低{minToStart}名必要
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
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
                選択中 {counts.selected}
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
                placeholder="メンバー名で検索..."
                className="w-full pl-10 pr-10 py-3 border rounded-lg text-base min-h-[48px] border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-background"
                aria-label="メンバー検索"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 px-3 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="検索をクリア"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* メンバーリスト */}
            <div className="border rounded-xl bg-muted/30 p-3 max-h-[400px] overflow-auto">
              {visibleMembers.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {visibleMembers.map((member) => {
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
                        className="w-full justify-start text-left h-auto min-h-[56px]"
                        left={
                          isSelected ? (
                            <PlayerNumber
                              number={order ?? ''}
                              variant="neutral"
                              size="xs"
                            />
                          ) : undefined
                        }
                        right={
                          isSelected ? (
                            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                          ) : undefined
                        }
                      >
                        <span className="truncate">{member.name}</span>
                      </SelectTile>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {searchTerm
                    ? '検索条件に一致するメンバーがいません'
                    : '表示できるメンバーがいません'}
                </div>
              )}
            </div>

            {/* 選択状態サマリー */}
            {selected.length > 0 && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {selected.length}名選択中
                    </span>
                  </div>
                  {selected.length >= minToStart ? (
                    <div className="text-xs text-primary font-medium">
                      準備完了
                    </div>
                  ) : (
                    <div className="text-xs text-amber-600 font-medium">
                      あと{needMore}名必要
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 開始ボタン */}
        <div className="sticky bottom-24 pb-4">
          <Button
            type="submit"
            variant="default"
            className="w-full h-14 text-lg font-bold shadow-2xl"
            disabled={selected.length < minToStart}
            size="lg"
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
      </form>
    </div>
  );
}
