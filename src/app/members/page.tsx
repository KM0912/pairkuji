'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, X, Trash2, Users, Edit3, Plus, CheckCircle2 } from 'lucide-react';
import { useMemberStore } from '@/lib/stores/memberStore';
import { usePracticeStore } from '@/lib/stores/practiceStore';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Card, CardContent } from '@/components/ui/card';

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
    update,
    remove,
    clearError,
  } = useMemberStore();
  const { players } = usePracticeStore();

  const [name, setName] = useState('');
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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
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
    if (!name.trim()) return;
    await add(name.trim());
    setName('');
    setIsAddModalOpen(false);
    setToast('選手を追加しました');
  };

  const openAddModal = () => {
    setIsAddModalOpen(true);
    setName('');
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setName('');
  };

  const openEditModal = (member: EditingMember) => {
    setEditingMember(member);
  };

  const closeEditModal = () => {
    setEditingMember(null);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setFlashingId(editingMember.id);
    await update(editingMember.id, { name: editingMember.name });
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
      <div className="space-y-6 pb-20">
        {/* ヘッダーセクション */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              メンバー管理
            </h1>
            <p className="text-sm text-muted-foreground">
              {members.length}名のメンバーが登録されています
            </p>
          </div>

          {/* 検索バー */}
          <div className="relative">
            <InputGroup>
              <InputGroupInput
                aria-label="選手検索"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="名前で検索..."
                className="text-base"
              />
              <InputGroupAddon>
                <Search className="w-5 h-5 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupAddon
                align="inline-end"
                onClick={() => setSearchTerm('')}
                aria-label="検索をクリア"
                className="cursor-pointer"
              >
                {searchTerm && <X className="w-4 h-4" />}
              </InputGroupAddon>
            </InputGroup>
          </div>
        </div>

        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4 flex justify-between items-center">
              <span className="text-sm text-destructive">{error}</span>
              <button
                className="text-sm underline text-destructive"
                onClick={clearError}
              >
                閉じる
              </button>
            </CardContent>
          </Card>
        )}

        {/* メンバー一覧 */}
        {filteredMembers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredMembers.map((member) => {
              const isFlashing = flashingId === member.id;
              const inPractice = practiceIdSet.has(member.id!);
              return (
                <Card
                  key={member.id}
                  className={`group transition-all duration-200 hover:shadow-md ${
                    isFlashing
                      ? 'ring-2 ring-primary/50 bg-primary/5'
                      : 'border-border'
                  } ${inPractice ? 'border-accent/40 bg-accent/5' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground truncate">
                            {member.name}
                          </h3>
                          {inPractice && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20">
                              <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                              <span className="text-xs text-accent font-medium">
                                参加中
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.isActive ? 'アクティブ' : '非アクティブ'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                          onClick={() =>
                            openEditModal({ id: member.id!, name: member.name })
                          }
                          title="編集"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-lg hover:bg-destructive/10 text-destructive disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          onClick={() =>
                            handleDeleteClick(member.id!, member.name)
                          }
                          title={
                            inPractice
                              ? '練習に参加中の選手は削除できません'
                              : '削除'
                          }
                          disabled={inPractice}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm
                  ? '該当するメンバーがいません'
                  : 'メンバーを追加しましょう'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm
                  ? '検索条件を変更して再度お試しください'
                  : '下のボタンから最初のメンバーを追加してください'}
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                  size="sm"
                >
                  検索をクリア
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* 選手追加モーダル */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-sm shadow-2xl border-2">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">
                    選手を追加
                  </h2>
                </div>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      名前
                    </label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="選手名を入力"
                      required
                      autoFocus
                      className="text-base"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
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
                      disabled={!name.trim()}
                      variant="default"
                      className="flex-1"
                    >
                      追加
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {editingMember && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-sm shadow-2xl border-2">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Edit3 className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">
                    選手情報を編集
                  </h2>
                </div>
                <form onSubmit={handleEditSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      名前
                    </label>
                    <Input
                      type="text"
                      value={editingMember.name}
                      onChange={(e) =>
                        setEditingMember({
                          ...editingMember,
                          name: e.target.value,
                        })
                      }
                      required
                      className="text-base"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
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
                      保存
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {deletingMember && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-sm shadow-2xl border-2 border-destructive/20">
              <CardContent className="p-6">
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
                    を削除します。
                  </p>
                  <p className="text-sm text-muted-foreground">
                    この操作は元に戻すことができません。
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
              </CardContent>
            </Card>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-foreground text-background px-6 py-3 rounded-xl shadow-2xl z-50 text-sm font-medium flex items-center gap-2 animate-in slide-in-from-bottom-4">
            <CheckCircle2 className="w-4 h-4" />
            {toast}
          </div>
        )}
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-24 left-4 right-4 z-30">
        <div className="max-w-6xl mx-auto">
          <Button
            onClick={openAddModal}
            className="w-full shadow-2xl h-12 text-base font-semibold"
            size="lg"
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              選手を追加
            </span>
          </Button>
        </div>
      </div>
    </>
  );
}
