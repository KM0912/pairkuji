"use client";

import { useEffect, useMemo, useState } from 'react';
import { useMemberStore } from '@/lib/stores/memberStore';
import { usePracticeStore } from '@/lib/stores/practiceStore';

export default function PracticePage() {
  const { members, load: loadMembers } = useMemberStore();
  const { settings, players, rounds, load, startPractice, toggleStatus, generateNextRound, resetPractice } = usePracticeStore();

  const [courts, setCourts] = useState(2);
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    loadMembers();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!settings) return;
    // keep selected list in sync with players when practice is active
    setSelected(players.map(p => p.memberId));
  }, [settings, players]);

  const memberMap = useMemo(() => new Map(members.map(m => [m.id!, m])), [members]);

  const onToggleSelect = (id: number) => {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const onStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length < 4) return;
    await startPractice(courts, selected);
  };

  const latestRound = rounds[rounds.length - 1];
  const initialOf = (name?: string) => (name ? name.trim().slice(0, 1) : '?');

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">練習</h1>
          {settings && (
            <button className="text-sm text-red-600 underline" onClick={() => resetPractice()}>リセット</button>
          )}
        </div>

        {!settings ? (
          <form onSubmit={onStart} className="bg-white p-6 rounded-xl border shadow-sm mb-8 space-y-6">
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-1">コート数</label>
              <select
                value={courts}
                onChange={e => setCourts(Number(e.target.value))}
                className="border rounded px-3 py-2 bg-white text-gray-900 border-gray-300"
              >
                {[2, 3, 4, 5, 6].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm text-gray-700">参加者を選択</label>
                <div className="text-sm text-gray-500">{selected.length} 名</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-auto border rounded p-2">
                {members.map(m => {
                  const isSelected = selected.includes(m.id!);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onToggleSelect(m.id!)}
                      className={`flex items-center justify-between rounded px-3 py-2 border text-left transition ${
                        isSelected
                          ? 'bg-blue-50 border-blue-400 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <span className={m.isActive ? '' : 'text-gray-400'}>{m.name}</span>
                      {isSelected && <span className="text-blue-600">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              <button
                type="submit"
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                disabled={selected.length < 4}
              >
                練習を開始
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-8">
            {/* Settings and participants */}
            <section className="bg-white p-6 rounded-xl border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-gray-700">コート数: <strong>{settings.courts}</strong></div>
                <div className="text-gray-700">ラウンド: <strong>{settings.currentRound}</strong></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {players.map(p => {
                  const m = memberMap.get(p.memberId);
                  if (!m) return null;
                  return (
                    <div key={p.memberId} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 shadow-sm">
                      <span className="text-gray-900">{m.name}</span>
                      <button
                        className={`text-sm px-3 py-1 rounded-full border transition ${
                          p.status === 'active'
                            ? 'bg-green-50 border-green-400 text-green-700 hover:bg-green-100'
                            : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                        }`}
                        onClick={() => toggleStatus(p.memberId)}
                      >
                        {p.status === 'active' ? '出場可' : '休憩'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Generate and show round */}
            <section className="bg-white p-6 rounded-xl border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">組み合わせ</h2>
                <button
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  onClick={() => generateNextRound()}
                  disabled={players.filter(p => p.status === 'active').length < 4}
                >
                  次の組み合わせを生成
                </button>
              </div>
              {latestRound ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-500">Round {latestRound.roundNo}</div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {latestRound.courts.map(cm => (
                      <div
                        key={cm.courtNo}
                        className="rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            Court {cm.courtNo}
                          </span>
                        </div>
                        <div className="flex items-stretch gap-3">
                          {/* Team A */}
                          <div className="flex-1 rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700 mb-2">Team A</div>
                            <div className="flex flex-col gap-2">
                              {cm.pairA.map((id) => {
                                const name = memberMap.get(id)?.name ?? '???';
                                return (
                                  <div key={id} className="flex items-center gap-2 rounded-full bg-white border border-indigo-100 px-2.5 py-1.5">
                                    <div className="h-7 w-7 shrink-0 rounded-full bg-indigo-600 text-white grid place-items-center text-xs font-semibold">
                                      {initialOf(name)}
                                    </div>
                                    <div className="text-sm text-gray-900">{name}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* VS */}
                          <div className="self-center text-gray-500">
                            <div className="h-10 w-10 rounded-full bg-gray-100 grid place-items-center font-semibold">VS</div>
                          </div>

                          {/* Team B */}
                          <div className="flex-1 rounded-lg border border-rose-100 bg-rose-50/60 p-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-rose-700 mb-2">Team B</div>
                            <div className="flex flex-col gap-2">
                              {cm.pairB.map((id) => {
                                const name = memberMap.get(id)?.name ?? '???';
                                return (
                                  <div key={id} className="flex items-center gap-2 rounded-full bg-white border border-rose-100 px-2.5 py-1.5">
                                    <div className="h-7 w-7 shrink-0 rounded-full bg-rose-600 text-white grid place-items-center text-xs font-semibold">
                                      {initialOf(name)}
                                    </div>
                                    <div className="text-sm text-gray-900">{name}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {latestRound.rests.length > 0 && (
                    <div className="rounded-lg border bg-white p-3 text-sm text-gray-700">
                      <div className="mb-2 font-medium text-gray-900">休憩</div>
                      <div className="flex flex-wrap gap-2">
                        {latestRound.rests.map(id => {
                          const name = memberMap.get(id)?.name ?? '???';
                          return (
                            <span key={id} className="inline-flex items-center gap-1.5 rounded-full border bg-gray-50 px-2.5 py-1 text-sm text-gray-800">
                              <span className="h-2 w-2 rounded-full bg-gray-400" />
                              {name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500">まだ組み合わせがありません。ボタンで生成してください。</div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
