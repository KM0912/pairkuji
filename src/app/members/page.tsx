'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, X, Trash2 } from 'lucide-react';
import { useMemberStore } from '@/lib/stores/memberStore';
import { usePracticeStore } from '@/lib/stores/practiceStore';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/practice/Header';

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
    <main className="bg-slate-50 min-h-screen">
      <Header settings={null} onReset={() => {}} />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <form
          onSubmit={handleAdd}
          className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-2 mb-4"
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

        <div className="mb-4">
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
          <p className="mt-2 text-xs text-slate-500">
            {isLoading
              ? '読み込み中…'
              : `${filteredMembers.length} 名が表示されています`}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-700 flex justify-between items-center">
            <span>{error}</span>
            <button className="text-sm underline" onClick={clearError}>
              閉じる
            </button>
          </div>
        )}

        <ul className="space-y-2">
          {filteredMembers.map((member) => {
            const isFlashing = flashingId === member.id;
            const inPractice = practiceIdSet.has(member.id!);
            return (
              <li key={member.id} className="transition-all duration-300">
                <div
                  className={`flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm active:scale-[0.995] transition-transform ${
                    isFlashing ? 'ring-2 ring-blue-300' : ''
                  }`}
                >
                  <button
                    type="button"
                    className="flex-1 text-left min-w-0"
                    onClick={() =>
                      openEditModal({ id: member.id!, name: member.name })
                    }
                  >
                    <span className="font-medium text-slate-800 truncate block">
                      {member.name}
                    </span>
                    {inPractice && (
                      <span className="text-[11px] text-emerald-600">
                        練習に参加中
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="ml-3 px-3 py-2 rounded-lg border bg-white hover:bg-red-50 text-red-600 min-h-[36px] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => handleDeleteClick(member.id!, member.name)}
                    title={
                      inPractice ? '練習に参加中の選手は削除できません' : '削除'
                    }
                    disabled={inPractice}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })}

          {!isLoading && filteredMembers.length === 0 && (
            <li className="text-center text-gray-500 py-10">
              選手はいません。上のフォームから追加してください。
            </li>
          )}
        </ul>

        {editingMember && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">選手情報を編集</h2>
                <form onSubmit={handleEditSave} className="space-y-4">
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

        {deletingMember && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
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

        {toast && (
          <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
            {toast}
          </div>
        )}
      </div>
    </main>
  );
}
