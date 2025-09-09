'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMemberStore } from '@/lib/stores/memberStore';

export default function MembersPage() {
  const { members, isLoading, error, load, add, update, remove, clearError } =
    useMemberStore();
  const [name, setName] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'active':
        return members.filter((m) => m.isActive);
      case 'inactive':
        return members.filter((m) => !m.isActive);
      default:
        return members;
    }
  }, [members, filter]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await add(name.trim());
    setName('');
  };

  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          選手管理
        </h1>

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
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-600">フィルター:</span>
          {(['all', 'active', 'inactive'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`text-sm px-3 py-1 rounded border ${
                filter === key
                  ? 'bg-blue-50 border-blue-400 text-blue-700'
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              {key === 'all'
                ? 'すべて'
                : key === 'active'
                  ? 'アクティブ'
                  : '非アクティブ'}
            </button>
          ))}
          <div className="ml-auto text-sm text-gray-500">
            {isLoading ? '読み込み中…' : `${members.length} 名`}
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
          {filtered.map((m) => (
            <li
              key={m.id}
              className="bg-white p-4 rounded-lg shadow flex items-center gap-3"
            >
              <input
                className="border rounded px-2 py-1 flex-1 bg-white text-gray-900 border-gray-300"
                defaultValue={m.name}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val && val !== m.name) update(m.id!, { name: val });
                }}
              />
              <button
                className={`px-3 py-2 rounded-lg text-sm border min-h-[40px] ${
                  m.isActive
                    ? 'bg-green-50 border-green-400 text-green-700'
                    : 'bg-gray-50 border-gray-300 text-gray-600'
                }`}
                onClick={() => update(m.id!, { isActive: !m.isActive })}
                title={m.isActive ? '非アクティブにする' : 'アクティブにする'}
              >
                {m.isActive ? 'アクティブ' : '非アクティブ'}
              </button>
              <button
                className="px-3 py-2 rounded-lg text-sm border bg-white hover:bg-red-50 text-red-600 min-h-[40px]"
                onClick={() => remove(m.id!)}
              >
                削除
              </button>
            </li>
          ))}
          {!isLoading && filtered.length === 0 && (
            <li className="text-center text-gray-500 py-10">
              選手はいません。上のフォームから追加してください。
            </li>
          )}
        </ul>
      </div>
    </main>
  );
}
