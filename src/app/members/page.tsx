'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, X, Trash2, Users, Edit3, Plus } from 'lucide-react';
import { db } from '@/lib/db';
import { useMemberStore } from '@/lib/stores/memberStore';
import { usePracticeStore } from '@/lib/stores/practiceStore';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { SampleBadge } from '@/components/members/SampleBadge';
interface EditingMember {
  id: number;
  name: string;
}

export default function MembersPage() {
  const {
    members,
    isLoading,
    isInitialLoad,
    error,
    load,
    add,
    addMany,
    update,
    remove,
    clearError,
  } = useMemberStore();
  const { players } = usePracticeStore();

  const [name, setName] = useState('');
  const [bulkNames, setBulkNames] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [flashingId, setFlashingId] = useState<number | null>(null);
  const [editingMember, setEditingMember] = useState<EditingMember | null>(
    null
  );
  const [deletingMember, setDeletingMember] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDeletedName, setConfirmDeletedName] = useState<string | null>(
    null
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(id);
  }, [toast]);

  const practiceIdSet = useMemo(
    () => new Set(players.map((p) => p.memberId)),
    [players]
  );

  const filteredMembers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const list = [...members].sort((a, b) =>
      a.name.localeCompare(b.name, 'ja')
    );
    if (!term) return list;
    return list.filter((member) => member.name.toLowerCase().includes(term));
  }, [members, searchTerm]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const single = name.trim();
    const pasted = bulkNames
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (!single && pasted.length === 0) return;

    if (pasted.length > 0) {
      const result = await addMany(single ? [single, ...pasted] : pasted);
      const skipped =
        result.skipped.length > 0
          ? `（${result.skipped.length}人は同じ名前があるためスキップ）`
          : '';
      setToast(
        result.added > 0
          ? `${result.added}人追加しました${skipped}`
          : `新しい名前はありませんでした${skipped}`
      );
    } else {
      const id = await add(single);
      if (id == null) return;
      setToast('選手を追加しました');
    }
    setName('');
    setBulkNames('');
    setIsAddModalOpen(false);
  };

  const openAddModal = () => {
    setIsAddModalOpen(true);
    setName('');
    setBulkNames('');
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setName('');
    setBulkNames('');
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    await update(id, { isActive: !isActive });
    setToast(
      isActive
        ? '今は来ないにしました。練習の参加者選択から外れます'
        : '参加者選択に戻しました'
    );
  };

  const openEditModal = (member: EditingMember) => {
    setEditingMember(member);
  };

  const closeEditModal = () => {
    setEditingMember(null);
    setConfirmDeletedName(null);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    const trimmed = editingMember.name.trim();
    const rows = await db.members.toArray();
    const deletedSame = rows.some(
      (row) => row.isDeleted && row.id !== editingMember.id && row.name.trim() === trimmed
    );
    if (deletedSame && confirmDeletedName !== trimmed) {
      setConfirmDeletedName(trimmed);
      return;
    }

    const saved = await update(editingMember.id, { name: editingMember.name });
    if (!saved) return;
    setFlashingId(editingMember.id);
    setTimeout(() => setFlashingId(null), 1000);
    setToast('保存しました');
    closeEditModal();
  };

  const handleDeleteClick = (id: number, memberName: string) => {
    if (practiceIdSet.has(id)) {
      setToast('練習に参加中の選手は削除できません');
      return;
    }
    setDeletingMember({ id, name: memberName });
  };

  const handleConfirmDelete = async () => {
    if (!deletingMember) return;
    await remove(deletingMember.id);
    setDeletingMember(null);
    setToast('削除しました');
  };

  const handleCancelDelete = () => {
    setDeletingMember(null);
  };

  if (isLoading || !isInitialLoad) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="size-8" />
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 pb-16">
        <div className="mb-4">
          <div className="relative">
            <InputGroup className="h-11 bg-white dark:bg-input/30">
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
          </div>
          <p className="mt-2 text-small text-muted-foreground">
            {isLoading
              ? '読み込み中…'
              : `${filteredMembers.length}人が表示されています`}
          </p>
          {members.some((member) => member.isSample) && (
            <p className="mt-1 text-xs text-muted-foreground">
              「サンプル」は最初から入っている見本です。不要なら削除できます。
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-destructive/10 text-destructive flex justify-between items-center">
            <span>{error}</span>
            <button className="text-sm underline" onClick={clearError}>
              閉じる
            </button>
          </div>
        )}

        {/* メンバー一覧 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filteredMembers.map((member) => {
            const isFlashing = flashingId === member.id;
            const inPractice = practiceIdSet.has(member.id!);
            return (
              <div
                key={member.id}
                className={`group rounded-xl border-2 bg-card shadow-level-1 hover:shadow-level-2 hover:-translate-y-0.5 transition-all duration-normal ease-out-expo ${
                  isFlashing
                    ? 'ring-2 ring-primary/40 bg-primary/10 border-primary/30'
                    : 'border-border/60'
                } ${inPractice ? 'border-accent/40 bg-accent/10 shadow-accent/20' : ''} ${
                  member.isActive ? '' : 'opacity-70'
                }`}
              >
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="mb-1 flex items-center gap-1 font-medium text-foreground">
                        <span className="truncate">{member.name}</span>
                        {member.isSample && <SampleBadge />}
                      </h3>
                      {inPractice && (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
                            <span className="text-small text-accent font-medium">
                              練習に参加中
                            </span>
                          </div>
                          <p className="text-small text-muted-foreground">
                            参加中は削除できません
                          </p>
                        </div>
                      )}
                      {!member.isActive && (
                        <span className="text-small font-medium text-muted-foreground">
                          今は来ない
                        </span>
                      )}
                    </div>
                    <div className="ml-2 flex items-center">
                      <button
                        type="button"
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary/10"
                        onClick={() =>
                          openEditModal({ id: member.id!, name: member.name })
                        }
                        title="編集"
                        aria-label={`${member.name}を編集`}
                      >
                        <Edit3 className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
                        onClick={() =>
                          handleDeleteClick(member.id!, member.name)
                        }
                        title={
                          inPractice
                            ? '練習に参加中の選手は削除できません'
                            : '削除'
                        }
                        aria-label={`${member.name}を削除`}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!member.isActive}
                    onClick={() => void handleToggleActive(member.id!, member.isActive)}
                    className="mt-2 flex min-h-11 w-full items-center justify-between gap-3 border-t border-border/60 pt-2 text-left"
                  >
                    <span className="text-xs text-muted-foreground">今は来ない</span>
                    <span
                      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                        member.isActive ? 'bg-muted' : 'bg-primary'
                      }`}
                      aria-hidden="true"
                    >
                      <span
                        className={`absolute top-0.5 h-6 w-6 rounded-full bg-background shadow ${
                          member.isActive ? 'left-0.5' : 'left-5'
                        }`}
                      />
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 空状態 */}
        {!isLoading && filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {searchTerm
                ? '該当する選手がいません'
                : '選手を追加しましょう'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm
                ? '検索条件を変更して再度お試しください'
                : '下のボタンから最初の選手を追加してください'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                検索をクリア
              </button>
            )}
          </div>
        )}

        {/* 選手追加モーダル */}
        <Dialog open={isAddModalOpen} onOpenChange={(open) => !open && closeAddModal()}>
          <DialogContent className="max-w-sm rounded-2xl border-2 border-border/50 p-6">
            <DialogTitle className="text-lg font-semibold mb-4">選手を追加</DialogTitle>
            <DialogDescription className="sr-only">新しい選手を追加します</DialogDescription>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label htmlFor="new-player-name" className="block text-sm font-medium text-foreground mb-1">
                  名前
                </label>
                <input
                  id="new-player-name"
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 bg-card border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="選手名を入力"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  まとめて追加（改行区切り）
                </label>
                <Textarea
                  value={bulkNames}
                  onChange={(event) => setBulkNames(event.target.value)}
                  placeholder={'山田\n佐藤\n鈴木'}
                  aria-label="改行区切りの名前"
                  className="min-h-28"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  すでにいる名前はスキップします。
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={closeAddModal}
                  variant="secondary"
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  disabled={!name.trim() && !bulkNames.trim()}
                  variant="default"
                  className="flex-1"
                >
                  追加
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* 選手編集モーダル */}
        <Dialog open={!!editingMember} onOpenChange={(open) => !open && closeEditModal()}>
          <DialogContent className="max-w-sm rounded-2xl border-2 border-border/50 p-6">
            <DialogTitle className="text-lg font-semibold mb-4">選手情報を編集</DialogTitle>
            <DialogDescription className="sr-only">選手の名前を編集します</DialogDescription>
            {editingMember && (
              <form onSubmit={handleEditSave} className="space-y-4">
                <div>
                  <label htmlFor="edit-player-name" className="block text-sm font-medium text-foreground mb-1">
                    名前
                  </label>
                  <input
                    id="edit-player-name"
                    type="text"
                    className="w-full border rounded-lg px-3 py-2 bg-card border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editingMember.name}
                    onChange={(e) => {
                      setConfirmDeletedName(null);
                      setEditingMember({
                        ...editingMember,
                        name: e.target.value,
                      });
                    }}
                    required
                  />
                </div>
                {confirmDeletedName === editingMember.name.trim() && (
                  <p role="alert" className="text-sm text-amber-900">
                    削除済みの「{confirmDeletedName}」と同じ名前です。履歴では「(削除)
                    {confirmDeletedName} ID …」と、この端末の選手IDを付けて区別します。この名前で保存しますか？
                  </p>
                )}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={closeEditModal}
                    variant="secondary"
                    className="flex-1"
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="submit"
                    disabled={!editingMember.name.trim()}
                    variant="default"
                    className="flex-1"
                  >
                    {confirmDeletedName === editingMember.name.trim()
                      ? 'この名前で保存'
                      : '保存'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* 削除確認モーダル */}
        <Dialog open={!!deletingMember} onOpenChange={(open) => !open && handleCancelDelete()}>
          <DialogContent className="max-w-sm rounded-2xl border-2 border-border/50 p-6">
            <DialogTitle className="sr-only">選手の削除</DialogTitle>
            <DialogDescription className="sr-only">選手を削除する確認ダイアログ</DialogDescription>
            {deletingMember && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
                    <Trash2 className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    選手を削除しますか？
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    <span className="font-medium text-foreground">
                      「{deletingMember.name}」
                    </span>
                    を名簿から外します。
                  </p>
                  <p className="text-sm text-muted-foreground">
                    過去の練習記録には名前が残ります。名簿の一覧には表示されなくなります。
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleCancelDelete}
                    variant="secondary"
                    className="flex-1"
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleConfirmDelete}
                    variant="destructive"
                    className="flex-1"
                  >
                    削除
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

      </div>

      {/* Fixed Bottom Buttons */}
      <div className="bottom-above-nav fixed left-4 right-4 z-overlay">
        <div className="mx-auto max-w-2xl space-y-3">
          {toast && (
            <div role="status" aria-live="polite" className="rounded-xl bg-foreground px-5 py-3 text-center text-caption font-medium text-background shadow-level-3">
              {toast}
            </div>
          )}
          <div className="flex gap-3">
            <Button onClick={openAddModal} className="flex-1 shadow-2xl">
              <span className="inline-flex items-center gap-2 font-semibold">
                <Plus className="w-5 h-5" />
                選手を追加
              </span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
