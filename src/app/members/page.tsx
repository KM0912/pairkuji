'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, X, Trash2, Users, Edit3 } from 'lucide-react';
import { useMemberStore } from '@/lib/stores/memberStore';
import { usePracticeStore } from '@/lib/stores/practiceStore';
import { Button } from '@/components/ui/button';

interface EditingMember {
  id: number;
  name: string;
}

export default function MembersPage() {
  const { members, isLoading, error, load, add, update, remove, clearError } =
    useMemberStore();
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
  const [toast, setToast] = useState<string | null>(null);

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
    if (!name.trim()) return;
    await add(name.trim());
    setName('');
    setToast('選手を追加しました');
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

  return (
    <>
      <div className="space-y-6">
        <form
          onSubmit={handleAdd}
          className="bg-card p-4 rounded-xl shadow-sm border border-border flex gap-2 mb-4"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="選手名を入力"
            className="flex-1 rounded-lg px-3 py-2 bg-card border border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <Button variant="primary" type="submit" disabled={!name.trim()}>
            追加
          </Button>
        </form>

        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="名前で検索"
              className="w-full pl-10 pr-4 py-3 border rounded-lg text-base min-h-[48px] border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              aria-label="選手検索"
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
          <p className="mt-2 text-xs text-muted-foreground">
            {isLoading
              ? '読み込み中…'
              : `${filteredMembers.length} 名が表示されています`}
          </p>
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
                className={`group rounded-lg border bg-card shadow-sm hover:shadow-md transition-all duration-200 ${
                  isFlashing
                    ? 'ring-2 ring-primary/30 bg-primary/10'
                    : 'border-border'
                } ${inPractice ? 'border-accent/30 bg-accent/10' : ''}`}
              >
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate mb-1">
                        {member.name}
                      </h3>
                      {inPractice && (
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
                          <span className="text-xs text-accent font-medium">
                            練習に参加中
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        type="button"
                        className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"
                        onClick={() =>
                          openEditModal({ id: member.id!, name: member.name })
                        }
                        title="編集"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
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
                ? '該当するメンバーがいません'
                : 'メンバーを追加しましょう'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm
                ? '検索条件を変更して再度お試しください'
                : '上のフォームから最初のメンバーを追加してください'}
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

        {editingMember && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-xl w-full max-w-sm shadow-xl border border-border">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">選手情報を編集</h2>
                <form onSubmit={handleEditSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      名前
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-3 py-2 bg-card border-border focus:outline-none focus:ring-2 focus:ring-primary"
                      value={editingMember.name}
                      onChange={(e) =>
                        setEditingMember({
                          ...editingMember,
                          name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      onClick={closeEditModal}
                      variant="default"
                      className="flex-1"
                    >
                      キャンセル
                    </Button>
                    <Button
                      type="submit"
                      disabled={!editingMember.name.trim()}
                      variant="primary"
                      className="flex-1"
                    >
                      保存
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {deletingMember && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-2xl w-full max-w-sm mx-4 shadow-xl border border-border">
              <div className="p-6">
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
                    variant="default"
                    className="flex-1"
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleConfirmDelete}
                    variant="danger"
                    className="flex-1"
                  >
                    削除
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
            {toast}
          </div>
        )}
      </div>
    </>
  );
}
