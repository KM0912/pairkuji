'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMemberStore } from '@/lib/stores/memberStore';

export default function MembersPage() {
  const { members, isLoading, error, load, add, update, remove, clearError } =
    useMemberStore();
  const [name, setName] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [flashingId, setFlashingId] = useState<number | null>(null);
  const [editingMember, setEditingMember] = useState<{
    id: number;
    name: string;
    isActive: boolean;
  } | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let result;
    switch (filter) {
      case 'active':
        result = members.filter((m) => m.isActive);
        break;
      case 'inactive':
        result = members.filter((m) => !m.isActive);
        break;
      default:
        result = members;
    }
    return result.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  }, [members, filter]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await add(name.trim());
    setName('');
  };

  const onToggleActive = async (id: number, isActive: boolean) => {
    setFlashingId(id);
    await update(id, { isActive: !isActive });
    setTimeout(() => setFlashingId(null), 1000);
  };

  const openEditModal = (member: {
    id: number;
    name: string;
    isActive: boolean;
  }) => {
    setEditingMember(member);
  };

  const closeEditModal = () => {
    setEditingMember(null);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setFlashingId(editingMember.id);
    await update(editingMember.id, {
      name: editingMember.name,
      isActive: editingMember.isActive,
    });
    setTimeout(() => setFlashingId(null), 1000);
    closeEditModal();
  };

  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">選手管理</h1>

        {/* Add form */}
        <form
          onSubmit={onSubmit}
          className="bg-white p-4 rounded-lg shadow flex gap-2 mb-6"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="選手名を入力"
            className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 border-gray-300 placeholder:text-gray-400"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium min-h-[48px]"
            disabled={!name.trim()}
          >
            追加
          </button>
        </form>

        {/* Filters */}
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-sm text-gray-600 flex-shrink-0">
              フィルター:
            </span>
            {(['all', 'active', 'inactive'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`text-sm px-3 py-1 rounded border flex-shrink-0 ${
                  filter === key
                    ? 'bg-blue-50 border-blue-400 text-blue-700'
                    : 'bg-white hover:bg-gray-50 border-gray-200'
                }`}
              >
                {key === 'all' ? 'すべて' : key === 'active' ? '有効' : '無効'}
              </button>
            ))}
          </div>
          <div className="text-sm text-gray-500">
            {isLoading
              ? '読み込み中…'
              : `${filtered.length} / ${members.length} 名`}
          </div>
        </div>

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
              <li
                key={m.id}
                className={`p-4 rounded-lg shadow flex items-center gap-3 transition-all duration-300 ${
                  m.isActive
                    ? 'bg-white border-l-4 border-l-green-400'
                    : 'bg-gray-50 border-l-4 border-l-gray-300'
                } ${
                  isFlashing
                    ? 'ring-2 ring-blue-400 ring-opacity-75 bg-blue-50'
                    : ''
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${m.isActive ? 'bg-green-500' : 'bg-gray-400'}`}
                  />
                  <button
                    className="text-left flex-1 text-gray-900 min-w-0 truncate font-medium"
                    onClick={() =>
                      openEditModal({
                        id: m.id!,
                        name: m.name,
                        isActive: m.isActive,
                      })
                    }
                  >
                    {m.name}
                  </button>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    className={`px-2 py-2 rounded-lg text-xs border min-h-[40px] min-w-[60px] transition-colors flex items-center justify-center gap-1 ${
                      m.isActive
                        ? 'bg-green-50 border-green-400 text-green-700 hover:bg-green-100'
                        : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => onToggleActive(m.id!, m.isActive)}
                    title={m.isActive ? '無効にする' : '有効にする'}
                  >
                    {m.isActive ? (
                      <>
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        有効
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        無効
                      </>
                    )}
                  </button>
                  <button
                    className="px-2 py-2 rounded-lg border bg-white hover:bg-red-50 text-red-600 min-h-[40px] min-w-[40px] flex items-center justify-center"
                    onClick={() => remove(m.id!)}
                    title="削除"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
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
                <h2 className="text-lg text-gray-900 font-semibold mb-4">
                  選手情報を編集
                </h2>
                <form onSubmit={saveEdit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      名前
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-3 py-2 bg-white text-gray-900 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ステータス
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingMember({ ...editingMember, isActive: true })
                        }
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                          editingMember.isActive
                            ? 'bg-green-50 border-green-400 text-green-700'
                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        有効
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingMember({
                            ...editingMember,
                            isActive: false,
                          })
                        }
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                          !editingMember.isActive
                            ? 'bg-gray-50 border-gray-300 text-gray-600'
                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        無効
                      </button>
                    </div>
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
      </div>
    </main>
  );
}
