'use client';

import { useEffect, useMemo, useState } from 'react';
import { Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import type { Member } from '@/types/member';
import { db } from '@/lib/db';
import { useMemberStore } from '@/lib/stores/memberStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { PlayerNumber } from '@/components/ui/PlayerNumber';
import { SelectTile } from '@/components/ui/SelectTile';
import { SelectedParticipantsSortableList } from '@/components/practice/SelectedParticipantsSortableList';
import { SampleBadge } from '@/components/members/SampleBadge';
import { cn } from '@/lib/utils';

type ViewFilter = 'all' | 'selected' | 'unselected' | 'inactive';

interface MemberRosterProps {
  members: Member[];
  selection?: {
    selected: number[];
    onToggle: (id: number) => void;
    onReorder: (ids: number[]) => void;
    onMembersCreated: (ids: number[]) => void;
  };
  protectedMemberIds?: number[];
}

const dialogClassName =
  'top-1/2 max-h-[85dvh] max-w-[calc(100%-2rem)] overflow-y-auto rounded-2xl border-2 border-border/50 p-6 sm:max-w-sm';

export function MemberRoster({
  members,
  selection,
  protectedMemberIds = [],
}: MemberRosterProps) {
  const { add, addMany, update, remove, error, clearError } = useMemberStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [bulkNames, setBulkNames] = useState('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [confirmDeletedName, setConfirmDeletedName] = useState<string | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const selected = selection?.selected ?? [];
  const selectedSet = new Set(selected);
  const activeMembers = useMemo(
    () =>
      members
        .filter((member) => member.isActive)
        .sort((a, b) => a.name.localeCompare(b.name, 'ja')),
    [members]
  );
  const inactiveMembers = useMemo(
    () =>
      members
        .filter((member) => !member.isActive)
        .sort((a, b) => a.name.localeCompare(b.name, 'ja')),
    [members]
  );
  const memberById = new Map(members.map((member) => [member.id!, member]));
  const term = searchTerm.trim().toLowerCase();
  const source =
    viewFilter === 'inactive'
      ? inactiveMembers
      : viewFilter === 'selected'
        ? selected
            .map((id) => memberById.get(id))
            .filter((member): member is Member => !!member)
        : viewFilter === 'unselected'
          ? activeMembers.filter((member) => !selectedSet.has(member.id!))
          : activeMembers;
  const visibleMembers = source.filter((member) =>
    member.name.toLowerCase().includes(term)
  );
  const filters: { id: ViewFilter; label: string; count: number }[] = [
    { id: 'all', label: '参加候補', count: activeMembers.length },
    ...(selection
      ? [
          { id: 'selected' as const, label: '選択中', count: selected.length },
          {
            id: 'unselected' as const,
            label: '未選択',
            count: activeMembers.filter(
              (member) => !selectedSet.has(member.id!)
            ).length,
          },
        ]
      : []),
    { id: 'inactive', label: '非表示', count: inactiveMembers.length },
  ];

  const openEdit = (member: Member) => {
    clearError();
    setConfirmDeletedName(null);
    setEditingMember({ ...member });
  };

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSaving) return;
    const singleName = name.trim();
    const pastedNames = bulkNames
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (!singleName && pastedNames.length === 0) return;
    setIsSaving(true);
    clearError();
    try {
      let memberIds: number[];
      let message: string;
      if (pastedNames.length > 0) {
        const result = await addMany(
          singleName ? [singleName, ...pastedNames] : pastedNames
        );
        if (useMemberStore.getState().error) return;
        memberIds = result.memberIds;
        const skipped =
          result.skipped.length > 0
            ? `（${result.skipped.length}名は同じ名前があるためスキップ）`
            : '';
        message =
          result.added > 0
            ? `${result.added}名追加しました${skipped}`
            : `新しい名前はありませんでした${skipped}`;
      } else {
        const id = await add(singleName);
        if (id == null) return;
        memberIds = [id];
        message = '選手を追加しました';
      }
      selection?.onMembersCreated(memberIds);
      setViewFilter(selection && memberIds.length > 0 ? 'selected' : 'all');
      setSearchTerm('');
      setToast(message);
      setName('');
      setBulkNames('');
      setShowAdd(false);
    } catch (cause) {
      // addMany also reads existing names before starting its transaction.
      useMemberStore.setState({
        error:
          cause instanceof Error ? cause.message : '選手を追加できませんでした',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingMember || isSaving) return;
    const nextName = editingMember.name.trim();
    if (!nextName) return;
    setIsSaving(true);
    clearError();
    try {
      const rows = await db.members.toArray();
      const hasDeletedName = rows.some(
        (member) =>
          member.isDeleted &&
          member.id !== editingMember.id &&
          member.name.trim() === nextName
      );
      if (hasDeletedName && confirmDeletedName !== nextName) {
        setConfirmDeletedName(nextName);
        return;
      }
      const saved = await update(editingMember.id!, {
        name: nextName,
        isActive: editingMember.isActive,
      });
      if (!saved) return;
      setEditingMember(null);
      setToast('保存しました');
    } catch (cause) {
      useMemberStore.setState({
        error:
          cause instanceof Error ? cause.message : '選手を更新できませんでした',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !deletingMember ||
      isSaving ||
      protectedMemberIds.includes(deletingMember.id!)
    )
      return;
    setIsSaving(true);
    clearError();
    try {
      await remove(deletingMember.id!);
      if (useMemberStore.getState().error) return;
      setDeletingMember(null);
      setToast('削除しました');
    } finally {
      setIsSaving(false);
    }
  };

  const errorMessage = error ? (
    <p role="alert" className="text-sm text-destructive">
      {error}
    </p>
  ) : null;
  const editButton = (member: Member) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-11 shrink-0"
      aria-label={`${member.name}を編集`}
      title="名前・参加候補への表示・削除"
      onClick={() => openEdit(member)}
    >
      <Edit3 className="size-4" aria-hidden />
    </Button>
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {selection
          ? '名前をタップして参加者を選択。編集ボタンから名前変更・削除もできます。'
          : '名前や参加候補への表示を編集できます。'}
      </p>
      <div
        className={cn('grid grid-cols-2 gap-2', selection && 'sm:grid-cols-4')}
        aria-label="名簿の絞り込み"
      >
        {filters.map((filter) => (
          <SelectTile
            key={filter.id}
            size="sm"
            selected={viewFilter === filter.id}
            onClick={() => setViewFilter(filter.id)}
            className="justify-center text-xs"
          >
            {filter.label} {filter.count}
          </SelectTile>
        ))}
      </div>
      <InputGroup>
        <InputGroupInput
          aria-label="メンバー検索"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="名前で検索"
        />
        <InputGroupAddon>
          <Search className="size-5 text-muted-foreground" />
        </InputGroupAddon>
        {searchTerm && (
          <InputGroupAddon align="inline-end">
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              aria-label="検索をクリア"
              className="flex size-11 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="size-4" aria-hidden />
            </button>
          </InputGroupAddon>
        )}
      </InputGroup>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => {
          clearError();
          setName('');
          setBulkNames('');
          setShowAdd(true);
        }}
      >
        <Plus className="size-4" aria-hidden />
        選手を追加
      </Button>
      {toast && (
        <p
          role="status"
          className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-foreground"
        >
          {toast}
        </p>
      )}
      {!showAdd && !editingMember && !deletingMember && errorMessage}
      <div
        className={cn(
          'max-h-96 overflow-y-auto rounded-xl border border-border bg-muted/20 p-2',
          selection && viewFilter === 'selected'
            ? 'space-y-2'
            : 'grid grid-cols-1 gap-2 sm:grid-cols-2'
        )}
      >
        {selection && viewFilter === 'selected' && !term ? (
          <SelectedParticipantsSortableList
            members={members}
            selected={selected}
            onReorder={selection.onReorder}
            onRemove={selection.onToggle}
            onEdit={openEdit}
          />
        ) : visibleMembers.length > 0 ? (
          <>
            {selection && viewFilter === 'selected' && term && (
              <p className="text-xs text-muted-foreground">
                並べ替えるには検索をクリアしてください。
              </p>
            )}
            {visibleMembers.map((member) => {
              const isSelected = selectedSet.has(member.id!);
              const isProtected = protectedMemberIds.includes(member.id!);
              const memberName = (
                <span className="min-w-0 flex-1 text-left">
                  <span className="flex min-w-0 items-center gap-1">
                    <span className="truncate">{member.name}</span>
                    {member.isSample && <SampleBadge />}
                  </span>
                  {!member.isActive && (
                    <span className="block text-xs text-muted-foreground">
                      候補から非表示
                    </span>
                  )}
                  {isProtected && (
                    <span className="block text-xs text-primary">
                      練習に参加中
                    </span>
                  )}
                </span>
              );
              return (
                <div
                  key={member.id}
                  className="flex min-w-0 items-center gap-1"
                >
                  {selection && member.isActive ? (
                    <SelectTile
                      selected={isSelected}
                      size="sm"
                      onClick={() => selection.onToggle(member.id!)}
                      aria-label={`${isSelected ? 'ダブルス参加者から外す' : 'ダブルス参加者に追加'}: ${member.name}`}
                      title={member.name}
                      className="min-w-0 flex-1 justify-start text-left"
                      left={
                        isSelected ? (
                          <PlayerNumber
                            number={selected.indexOf(member.id!) + 1}
                            variant="neutral"
                            size="xs"
                          />
                        ) : undefined
                      }
                    >
                      {memberName}
                    </SelectTile>
                  ) : (
                    <div className="flex min-h-11 min-w-0 flex-1 items-center rounded-lg border border-border bg-card px-3 py-2 text-sm">
                      {memberName}
                    </div>
                  )}
                  {editButton(member)}
                </div>
              );
            })}
          </>
        ) : (
          <p className="col-span-full px-3 py-8 text-center text-sm text-muted-foreground">
            {term
              ? '検索条件に一致するメンバーがいません'
              : viewFilter === 'inactive'
                ? '非表示にしている選手はいません'
                : viewFilter === 'unselected'
                  ? '参加候補は全員選択されています'
                  : members.length > 0
                    ? '参加候補がいません。「非表示」から表示設定を変更できます'
                    : 'まだ選手がいません。「選手を追加」から登録できます'}
          </p>
        )}
      </div>
      {members.some((member) => member.isSample) && (
        <p className="text-xs text-muted-foreground">
          「サンプル」は最初から入っている見本です。編集ボタンから名前変更・削除できます。
        </p>
      )}

      <Dialog
        open={showAdd}
        onOpenChange={(open) => {
          if (!open && !isSaving) {
            setShowAdd(false);
            clearError();
          }
        }}
      >
        <DialogContent className={dialogClassName}>
          <DialogTitle className="text-lg font-semibold">
            選手を追加
          </DialogTitle>
          <DialogDescription>
            {selection
              ? '追加した選手は、今回の参加者にも選択されます。'
              : '新しい選手を名簿に登録します。'}
          </DialogDescription>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label
                htmlFor="roster-new-name"
                className="mb-1 block text-sm font-medium"
              >
                名前
              </label>
              <Input
                id="roster-new-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="選手名を入力"
                autoFocus
                disabled={isSaving}
              />
            </div>
            <div>
              <label
                htmlFor="roster-bulk-names"
                className="mb-1 block text-sm font-medium"
              >
                まとめて追加（改行区切り）
              </label>
              <Textarea
                id="roster-bulk-names"
                value={bulkNames}
                onChange={(event) => setBulkNames(event.target.value)}
                placeholder={'山田\n佐藤\n鈴木'}
                className="min-h-28"
                disabled={isSaving}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                すでにいる名前はスキップします。
              </p>
            </div>
            {errorMessage}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowAdd(false);
                  clearError();
                }}
                disabled={isSaving}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSaving || (!name.trim() && !bulkNames.trim())}
              >
                {isSaving ? '追加中…' : selection ? '追加して選択' : '追加'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingMember}
        onOpenChange={(open) => {
          if (!open && !isSaving) {
            setEditingMember(null);
            clearError();
          }
        }}
      >
        <DialogContent className={dialogClassName}>
          <DialogTitle className="text-lg font-semibold">
            選手情報を編集
          </DialogTitle>
          <DialogDescription>
            名前や参加候補への表示を変更できます。
          </DialogDescription>
          {editingMember && (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label
                  htmlFor="roster-edit-name"
                  className="mb-1 block text-sm font-medium"
                >
                  名前
                </label>
                <Input
                  id="roster-edit-name"
                  value={editingMember.name}
                  onChange={(event) => {
                    setConfirmDeletedName(null);
                    setEditingMember({
                      ...editingMember,
                      name: event.target.value,
                    });
                  }}
                  required
                  disabled={isSaving}
                />
              </div>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={editingMember.isActive}
                  onChange={(event) =>
                    setEditingMember({
                      ...editingMember,
                      isActive: event.target.checked,
                    })
                  }
                  className="size-5 accent-primary"
                  disabled={isSaving}
                />
                参加候補に表示
              </label>
              <p className="text-xs text-muted-foreground">
                オフにすると参加候補から非表示になります。「非表示」の一覧から、いつでも戻せます。
              </p>
              {confirmDeletedName === editingMember.name.trim() && (
                <p role="alert" className="text-sm text-amber-900">
                  削除済みの「{confirmDeletedName}
                  」と同じ名前です。履歴では削除済みの選手にIDを付けて区別します。この名前で保存しますか？
                </p>
              )}
              {errorMessage}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setEditingMember(null);
                    clearError();
                  }}
                  disabled={isSaving}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSaving || !editingMember.name.trim()}
                >
                  {isSaving
                    ? '保存中…'
                    : confirmDeletedName === editingMember.name.trim()
                      ? 'この名前で保存'
                      : '保存'}
                </Button>
              </div>
              <div className="border-t border-border pt-3">
                <Button
                  type="button"
                  variant="destructiveOutline"
                  className="w-full"
                  disabled={
                    isSaving || protectedMemberIds.includes(editingMember.id!)
                  }
                  onClick={() => {
                    clearError();
                    setDeletingMember(
                      memberById.get(editingMember.id!) ?? editingMember
                    );
                    setEditingMember(null);
                  }}
                >
                  <Trash2 className="size-4" aria-hidden />
                  選手を削除
                </Button>
                {protectedMemberIds.includes(editingMember.id!) && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    練習に参加中の選手は削除できません。
                  </p>
                )}
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deletingMember}
        onOpenChange={(open) => {
          if (!open && !isSaving) {
            setDeletingMember(null);
            clearError();
          }
        }}
      >
        <DialogContent className={dialogClassName}>
          <DialogTitle className="text-lg font-semibold">
            選手を削除しますか？
          </DialogTitle>
          <DialogDescription>
            「{deletingMember?.name}
            」を名簿から外します。過去の練習記録には名前が残ります。
          </DialogDescription>
          {errorMessage}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={isSaving}
              onClick={() => {
                setDeletingMember(null);
                clearError();
              }}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              disabled={isSaving}
              onClick={() => void handleDelete()}
            >
              {isSaving ? '削除中…' : '削除'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
