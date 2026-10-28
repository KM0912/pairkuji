import { type Member } from '@/types/member';
import { useState, useMemo } from 'react';
import { Search, X, Users, Play, Plus } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '../ui/input-group';
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
import { TagSelector } from './TagSelector';
import { SelectedParticipantsSortableList } from './SelectedParticipantsSortableList';
import { cn } from '@/lib/utils';
import { SampleBadge } from '@/components/members/SampleBadge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

interface ParticipantSelectionProps {
  members: Member[];
  courts: number;
  setCourts: (courts: number) => void;
  selected: number[];
  onToggleSelect: (id: number) => void;
  onReorderSelected: (orderedIds: number[]) => void;
  onStart: (e: React.FormEvent) => void;
  starting?: boolean;
  clubTags?: string[];
  onClubTagsChange?: (tags: string[]) => void;
  onCreateMember: (name: string) => Promise<void>;
}

export function ParticipantSelection({
  members,
  courts,
  setCourts,
  selected,
  onToggleSelect,
  onReorderSelected,
  onStart,
  starting = false,
  clubTags,
  onClubTagsChange,
  onCreateMember,
}: ParticipantSelectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
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
        .sort((a, b) => a.name.localeCompare(b.name, 'ja')),
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
  const memberById = useMemo(
    () => new Map(activeMembers.map((m) => [m.id!, m])),
    [activeMembers]
  );

  const selectedMembersInOrder = useMemo(
    () =>
      selected
        .map((id) => memberById.get(id))
        .filter((m): m is Member => m != null),
    [selected, memberById]
  );

  const visibleMembers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let list: Member[] = activeMembers;
    if (viewFilter === 'selected') list = selectedMembersInOrder;
    if (viewFilter === 'unselected')
      list = list.filter((m) => !selectedSet.has(m.id!));
    if (term) list = list.filter((m) => m.name.toLowerCase().includes(term));
    return list;
  }, [
    activeMembers,
    viewFilter,
    selectedSet,
    searchTerm,
    selectedMembersInOrder,
  ]);

  const submitNewMember = async () => {
    const name = newName.trim();
    if (!name || adding) return;
    setAdding(true);
    try {
      await onCreateMember(name);
      setNewName('');
      setShowAdd(false);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      <form onSubmit={onStart} className="">
        <div className="grid grid-cols-1 gap-4">
          {/* コート設定カード */}
          <Card>
            <CardHeader>
              <CardTitle></CardTitle>
              <div className="flex items-center gap-2">
                <IconBadge icon={PiCourtBasketball} className="text-primary" />
                <h3 className="text-base font-semibold text-foreground">
                  コート設定
                </h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-2">
                <CourtSelector courts={courts} setCourts={setCourts} />
                {runnableCourts < courts && selected.length >= 4 && (
                  <div className="mt-2 text-xs text-amber-800 bg-amber-50 px-2 py-1.5 rounded border border-amber-200">
                    参加者数により実際は{runnableCourts}コートで開始されます
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 参加者選択 */}
          <Card id="doubles-participants">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBadge icon={Users} size="md" className="text-primary" />
                <h3 className="text-base font-semibold text-foreground">
                  ダブルス参加者
                </h3>
              </CardTitle>
              <CardDescription>
                {selected.length}人選択中 • 最低4人必要
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
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
                  選択中{counts.selected}人
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
              <InputGroup className="h-11">
                <InputGroupInput
                  aria-label="選手検索"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="名前で検索"
                />
                <InputGroupAddon>
                  <Search className="w-5 h-5 text-muted-foreground" />
                </InputGroupAddon>
                {searchTerm && (
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      aria-label="検索をクリア"
                      className="min-h-11 min-w-11"
                      onClick={() => setSearchTerm('')}
                    >
                      <X className="h-4 w-4" />
                    </InputGroupButton>
                  </InputGroupAddon>
                )}
              </InputGroup>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setNewName('');
                  setShowAdd(true);
                }}
              >
                <Plus className="w-4 h-4" />
                選手を追加
              </Button>

              {/* メンバーリスト */}
              <Card>
                <CardContent
                  className={cn(
                    'p-3 max-h-80 overflow-auto',
                    viewFilter === 'selected'
                      ? 'space-y-2'
                      : 'grid grid-cols-2 gap-3'
                  )}
                >
                  {viewFilter === 'selected' && !searchTerm.trim() ? (
                    <SelectedParticipantsSortableList
                      members={members}
                      selected={selected}
                      onReorder={onReorderSelected}
                      onRemove={onToggleSelect}
                    />
                  ) : viewFilter === 'selected' && searchTerm.trim() ? (
                    <>
                      <p className="text-xs text-amber-800 bg-amber-50 px-2 py-1.5 rounded border border-amber-200">
                        並べ替えは検索をクリアしてください
                      </p>
                      {visibleMembers.length > 0 ? (
                        visibleMembers.map((member) => {
                          const order = selected.indexOf(member.id!) + 1;
                          return (
                            <SelectTile
                              key={member.id}
                              selected
                              onClick={() => onToggleSelect(member.id!)}
                              aria-label={`ダブルス参加者から外す: ${member.name}`}
                              title={member.name}
                              size="sm"
                              className="w-full justify-start text-left"
                              left={
                                <PlayerNumber
                                  number={order}
                                  variant="neutral"
                                  size="xs"
                                />
                              }
                            >
                              <span className="truncate">{member.name}</span>
                              {member.isSample && <SampleBadge />}
                            </SelectTile>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-muted-foreground text-caption">
                          検索条件に一致する参加者がいません
                        </div>
                      )}
                    </>
                  ) : visibleMembers.length > 0 ? (
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
                          <span className="flex min-w-0 items-center gap-1">
                            <span className="truncate">{member.name}</span>
                            {member.isSample && <SampleBadge />}
                          </span>
                        </SelectTile>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center py-8 text-muted-foreground text-caption">
                      {searchTerm
                        ? '検索条件に一致する選手がいません'
                        : 'まだ選手がいません。「選手を追加」から登録できます'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* クラブ */}
          {onClubTagsChange && (
            <TagSelector value={clubTags ?? []} onChange={onClubTagsChange} />
          )}

          <div className="bottom-above-nav fixed left-4 right-4 z-overlay">
            <div className="mx-auto max-w-2xl rounded-xl bg-background/95 p-2 shadow-level-2 backdrop-blur-sm">
              {selected.length < minToStart && (
                <p className="mb-2 text-center text-sm font-semibold text-foreground">
                  あと{needMore}人選択してください
                </p>
              )}
              <Button
                type="submit"
                variant="default"
                size="lg"
                className="w-full font-bold shadow-2xl"
                disabled={starting || selected.length < minToStart}
              >
                <span className="inline-flex items-center gap-3">
                  <Play className="w-6 h-6" />
                  {selected.length < minToStart
                    ? 'ダブルス練習開始'
                    : `ダブルス練習開始（${selected.length}人）`}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </form>

      <Dialog open={showAdd} onOpenChange={(open) => !open && setShowAdd(false)}>
        <DialogContent className="max-w-sm rounded-2xl border-2 border-border/50 p-6">
          <DialogTitle className="text-lg font-semibold">選手を追加</DialogTitle>
          <DialogDescription className="sr-only">
            その場で新しい選手を名簿に登録します
          </DialogDescription>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="new-member-name">
                名前
              </label>
              <input
                id="new-member-name"
                type="text"
                className="w-full rounded-lg border border-border bg-card px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.nativeEvent.isComposing || event.keyCode === 229) return;
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void submitNewMember();
                  }
                }}
                placeholder="選手名を入力"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setShowAdd(false)}
              >
                キャンセル
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={!newName.trim() || adding}
                onClick={() => void submitNewMember()}
              >
                追加して選択
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
