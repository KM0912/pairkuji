'use client';

import { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useMemberStore } from '@/lib/stores/memberStore';
import { usePracticeStore } from '@/lib/stores/practiceStore';
import { Button } from '@/components/ui/Button';
import { SelectTile } from '@/components/ui/SelectTile';

export default function MembersPage() {
  const { members, isLoading, error, load, add, update, remove, clearError } =
    useMemberStore();
  const { players } = usePracticeStore();
  const [name, setName] = useState('');
  // 有効/無効の切替機能は一旦廃止（DB上のカラムは維持）
  const [flashingId, setFlashingId] = useState<number | null>(null);
  const [editingMember, setEditingMember] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [deletingMember, setDeletingMember] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return [...members].sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  }, [members]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await add(name.trim());
    setName('');
  };

  // 有効/無効切り替え機能はUIから削除

  const openEditModal = (member: { id: number; name: string }) => {
    setEditingMember(member);
  };

  const closeEditModal = () => {
    setEditingMember(null);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setFlashingId(editingMember.id);
    await update(editingMember.id, { name: editingMember.name });
    setTimeout(() => setFlashingId(null), 1000);
    closeEditModal();
  };

  const handleDeleteClick = (id: number, name: string) => {
    // Check if member is currently in practice
    const isInPractice = players.some((p) => p.memberId === id);
    if (isInPractice) {
      setToast('練習に参加中の選手は削除できません');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setDeletingMember({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!deletingMember) return;

    await remove(deletingMember.id);
    setDeletingMember(null);
  };

  const handleCancelDelete = () => {
    setDeletingMember(null);
  };

  return (
    <main className="bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Sticky page header for consistency with practice UI */}
        <div className="sticky top-0 z-10 -mx-4 px-4 pb-3 bg-slate-50/80 backdrop-blur supports-[backdrop-filter]:bg-slate-50/60">
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-800">選手管理</div>
                  <div className="text-xs text-slate-500">{members.length} 名</div>
                </div>
              </div>
            </div>

        {/* Add form */}
        <form
          onSubmit={onSubmit}
          className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-2 mb-6"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="選手名を入力"
            className="flex-1 rounded-lg px-3 py-2 bg-white border border-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-600"
          />
          <Button variant="primary" type="submit" disabled={!name.trim()}>
            追加
          </Button>
        </form>

        {/* Count removed as requested */}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-700 flex justify-between items-center">
            <span>{error}</span>
            <button className="text-sm underline" onClick={clearError}>
              閉じる
            </button>
          </div>
        )}

        {/* List */}
        <ul className="space-y-2">
          {filtered.map((m) => {
            const isFlashing = flashingId === m.id;
            return (
              <li key={m.id} className="transition-all duration-300">
                <SelectTile
                  selected={false}
                  onClick={() =>
                    openEditModal({
                      id: m.id!,
                      name: m.name,
                    })
                  }
                  className={`w-full justify-between ${
                    isFlashing ? 'ring-2 ring-blue-400 ring-opacity-75' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-left flex-1 min-w-0 truncate font-medium">
                      {m.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="px-2 py-2 rounded-lg border bg-white hover:bg-red-50 text-red-600 min-h-[40px] min-w-[40px] flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(m.id!, m.name);
                    }}
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </SelectTile>
              </li>
            );
          })}
          {!isLoading && filtered.length === 0 && (
            <li className="text-center text-gray-500 py-10">
              選手はいません。上のフォームから追加してください。
            </li>
          )}
        </ul>

        {/* Edit Modal */}
        {editingMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-sm mx-4">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">選手情報を編集</h2>
                <form onSubmit={saveEdit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      名前
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-3 py-2 bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <button
                      type="button"
                      onClick={closeEditModal}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      disabled={!editingMember.name.trim()}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      保存
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl">
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    選手を削除しますか？
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium text-gray-900">
                      「{deletingMember.name}」
                    </span>
                    を削除します。
                  </p>
                  <p className="text-sm text-gray-600">
                    この操作は元に戻すことができません。
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCancelDelete}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
            {toast}
          </div>
        )}
      </div>
    </main>
  );
}
