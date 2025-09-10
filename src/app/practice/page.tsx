"use client";

import { useEffect, useMemo, useState } from 'react';
import { useMemberStore } from '@/lib/stores/memberStore';
import { usePracticeStore } from '@/lib/stores/practiceStore';

export default function PracticePage() {
  const { members, load: loadMembers } = useMemberStore();
  const { settings, players, rounds, load, startPractice, toggleStatus, generateNextRound, resetPractice, addParticipant, substitutePlayer } = usePracticeStore();

  const [courts, setCourts] = useState(2);
  const [selected, setSelected] = useState<number[]>([]);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [substituting, setSubstituting] = useState<number | null>(null);
  const [showPairStats, setShowPairStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadMembers();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!settings) {
      // practice is not active, clear selection
      setSelected([]);
      return;
    }
    // keep selected list in sync with players when practice is active
    setSelected(players.map(p => p.memberId));
  }, [settings, players]);

  const memberMap = useMemo(() => new Map(members.map(m => [m.id!, m])), [members]);
  const playerMap = useMemo(() => new Map(players.map(p => [p.memberId, p])), [players]);

  const onToggleSelect = (id: number) => {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const onStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length < 4) return;
    await startPractice(courts, selected);
  };

  const latestRound = rounds[rounds.length - 1];

  // Calculate match counts for each player
  const matchCounts = useMemo(() => {
    const counts = new Map<number, number>();
    
    rounds.forEach(round => {
      round.courts.forEach(court => {
        [...court.pairA, ...court.pairB].forEach(memberId => {
          counts.set(memberId, (counts.get(memberId) || 0) + 1);
        });
      });
    });
    
    return counts;
  }, [rounds]);

  // Calculate pair counts from all rounds
  const pairCounts = useMemo(() => {
    const counts = new Map<string, number>();
    
    rounds.forEach(round => {
      round.courts.forEach(court => {
        // Count pairs in Team A
        const [a1, a2] = court.pairA.sort((a, b) => a - b);
        if (a1 !== undefined && a2 !== undefined) {
          const key = `${a1}-${a2}`;
          counts.set(key, (counts.get(key) || 0) + 1);
        }
        
        // Count pairs in Team B
        const [b1, b2] = court.pairB.sort((a, b) => a - b);
        if (b1 !== undefined && b2 !== undefined) {
          const key = `${b1}-${b2}`;
          counts.set(key, (counts.get(key) || 0) + 1);
        }
      });
    });
    
    return counts;
  }, [rounds]);

  const availableMembers = members.filter(m =>
    m.isActive && !players.some(p => p.memberId === m.id)
  );

  const filteredMembers = useMemo(
    () =>
      members
        .filter(
          m => m.isActive && m.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [members, searchTerm]
  );

  const onAddParticipant = async (memberId: number) => {
    await addParticipant(memberId);
    setShowAddParticipant(false);
  };

  const onPlayerClick = async (memberId: number) => {
    if (!substituting) {
      // First click - select player for substitution
      setSubstituting(memberId);
    } else if (substituting === memberId) {
      // Click same player - deselect
      setSubstituting(null);
    } else {
      // Click different player - perform substitution
      await substitutePlayer(substituting, memberId);
      setSubstituting(null);
    }
  };

  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8 pt-6">
          <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-600 to-teal-400 bg-clip-text text-transparent">ペアくじ</h1>
          <p className="text-gray-600 text-sm">ダブルス練習管理</p>
          {settings && (
            <div className="mt-4">
              <button 
                className="text-sm bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors" 
                onClick={() => {
                  setSubstituting(null);
                  resetPractice();
                }}
              >
                練習をリセット
              </button>
            </div>
          )}
        </div>

        {!settings ? (
          <form onSubmit={onStart} className="bg-white p-6 rounded-xl border shadow-sm mb-8 space-y-6">
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-1">コート数</label>
              <select
                value={courts}
                onChange={e => setCourts(Number(e.target.value))}
                className="border rounded px-3 py-2 bg-white border-gray-300"
              >
                {Array.from({length: 10}, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm text-gray-700">参加者を選択</label>
                <div className="text-sm text-gray-500">{selected.length} 名選択中</div>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="名前で検索"
                className="w-full mb-2 px-3 py-2 border rounded"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-auto border rounded p-2">
                {filteredMembers.map(m => {
                  const isSelected = selected.includes(m.id!);
                  const selectionIndex = selected.indexOf(m.id!);
                  const playerNumber = selectionIndex !== -1 ? selectionIndex + 1 : null;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onToggleSelect(m.id!)}
                      className={`flex items-center justify-between rounded px-3 py-2 border text-left transition ${
                        isSelected
                          ? 'bg-blue-50 border-blue-400 text-blue-700'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {playerNumber && (
                          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-blue-600 rounded-full">
                            {playerNumber}
                          </span>
                        )}
                        <span>{m.name}</span>
                      </div>
                      {isSelected && <span className="text-blue-600">✓</span>}
                    </button>
                  );
                })}
              </div>
              <div className="text-xs text-gray-500 text-right mt-1">
                {selected.length < 4
                  ? `あと${4 - selected.length}名選択してください`
                  : '開始できます'}
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium min-h-[48px]"
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
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {players.sort((a, b) => a.playerNumber - b.playerNumber).map(p => {
                    const m = memberMap.get(p.memberId);
                    if (!m) return null;
                    return (
                      <div key={p.memberId} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 shadow-sm">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold text-white bg-blue-600 rounded-full">
                            {p.playerNumber}
                          </span>
                          <span className="truncate">{m.name}</span>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {matchCounts.get(p.memberId) || 0}試合
                          </span>
                        </div>
                        <button
                          className={`text-sm px-3 py-1 rounded-full border transition flex-shrink-0 ${
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

                {/* Add participant button */}
                <div className="flex justify-center pt-2">
                  <button
                    className="text-sm text-blue-600 hover:text-blue-700 border border-blue-300 hover:border-blue-400 px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                    onClick={() => setShowAddParticipant(true)}
                  >
                    + 参加者を追加
                  </button>
                </div>
              </div>
            </section>

            {/* Generate and show round */}
            <section className="bg-white p-6 rounded-xl border shadow-sm">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">組み合わせ</h2>
                  <button
                    onClick={() => setShowPairStats(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    ペア統計
                  </button>
                </div>
                <button
                  className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium min-h-[48px]"
                  onClick={() => generateNextRound()}
                  disabled={players.filter(p => p.status === 'active').length < 4}
                >
                  次の組み合わせを生成
                </button>
              </div>
              {latestRound ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-500">Round {latestRound.roundNo}</div>
                  <div className="grid grid-cols-1 gap-4">
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
                        <div className="flex items-center gap-2">
                          {/* Team A */}
                          <div className="flex-1 rounded-lg border border-indigo-100 bg-indigo-50/60 p-2 min-w-0">
                            <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700 mb-1">Team A</div>
                            <div className="space-y-1">
                              {cm.pairA.map((id) => {
                                const member = memberMap.get(id);
                                const player = playerMap.get(id);
                                const name = member?.name ?? '???';
                                const number = player?.playerNumber ?? '?';
                                return (
                                  <button 
                                    key={id} 
                                    className={`flex items-center gap-1 rounded-full px-2 py-1 transition-colors w-full min-w-0 ${
                                      substituting === id
                                        ? 'bg-yellow-100 border border-yellow-400 ring-2 ring-yellow-300'
                                        : 'bg-white border border-indigo-100 hover:bg-indigo-50'
                                    }`}
                                    onClick={() => onPlayerClick(id)}
                                  >
                                    <div className="h-4 w-4 shrink-0 rounded-full bg-indigo-600 text-white grid place-items-center text-xs font-semibold">
                                      {number}
                                    </div>
                                    <div className="text-xs truncate min-w-0 flex-1" title={name}>
                                      {name.length > 6 ? name.substring(0, 6) + '...' : name}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* VS */}
                          <div className="flex-shrink-0">
                            <div className="h-6 w-6 rounded-full bg-gray-100 grid place-items-center text-xs font-semibold text-gray-500">VS</div>
                          </div>

                          {/* Team B */}
                          <div className="flex-1 rounded-lg border border-rose-100 bg-rose-50/60 p-2 min-w-0">
                            <div className="text-xs font-semibold uppercase tracking-wide text-rose-700 mb-1">Team B</div>
                            <div className="space-y-1">
                              {cm.pairB.map((id) => {
                                const member = memberMap.get(id);
                                const player = playerMap.get(id);
                                const name = member?.name ?? '???';
                                const number = player?.playerNumber ?? '?';
                                return (
                                  <button 
                                    key={id} 
                                    className={`flex items-center gap-1 rounded-full px-2 py-1 transition-colors w-full min-w-0 ${
                                      substituting === id
                                        ? 'bg-yellow-100 border border-yellow-400 ring-2 ring-yellow-300'
                                        : 'bg-white border border-rose-100 hover:bg-rose-50'
                                    }`}
                                    onClick={() => onPlayerClick(id)}
                                  >
                                    <div className="h-4 w-4 shrink-0 rounded-full bg-rose-600 text-white grid place-items-center text-xs font-semibold">
                                      {number}
                                    </div>
                                    <div className="text-xs truncate min-w-0 flex-1" title={name}>
                                      {name.length > 6 ? name.substring(0, 6) + '...' : name}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {(() => {
                    // Get all players currently in courts
                    const playersInCourts = latestRound.courts.flatMap(court => [...court.pairA, ...court.pairB]);
                    // Get all active players not in courts
                    const restingPlayers = players
                      .filter(p => p.status === 'active' && !playersInCourts.includes(p.memberId))
                      .map(p => p.memberId);
                    
                    return restingPlayers.length > 0 && (
                      <div className="rounded-lg border bg-white p-3 text-sm text-gray-700">
                        <div className="mb-2 font-medium">休憩</div>
                        <div className="flex flex-wrap gap-2">
                          {restingPlayers.map(id => {
                            const member = memberMap.get(id);
                            const player = playerMap.get(id);
                            const name = member?.name ?? '???';
                            const number = player?.playerNumber ?? '?';
                            return (
                              <button 
                                key={id} 
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm transition-colors ${
                                  substituting === id
                                    ? 'bg-yellow-100 border-yellow-400 text-yellow-800 ring-2 ring-yellow-300'
                                    : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'
                                }`}
                                onClick={() => onPlayerClick(id)}
                              >
                                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-gray-500 rounded-full">
                                  {number}
                                </span>
                                <span title={name}>
                                  {name.length > 8 ? name.substring(0, 8) + '...' : name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-gray-500">まだ組み合わせがありません。ボタンで生成してください。</div>
              )}
            </section>
          </div>
        )}

        {/* Add Participant Modal */}
        {showAddParticipant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-sm mx-4">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">参加者を追加</h2>
                {availableMembers.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    追加できる選手がいません
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {availableMembers.map(m => (
                      <button
                        key={m.id}
                        onClick={() => onAddParticipant(m.id!)}
                        className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-3 pt-4 mt-4 border-t">
                  <button
                    onClick={() => setShowAddParticipant(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Substitution hint */}
        {substituting && (
          <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-blue-600 bg-white rounded-full">
                {playerMap.get(substituting)?.playerNumber}
              </span>
              <span>{memberMap.get(substituting)?.name}を選択中</span>
            </div>
          </div>
        )}

        {/* Pair Statistics Modal */}
        {showPairStats && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">ペア統計</h2>
                  <button
                    onClick={() => setShowPairStats(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Generate all possible pairs */}
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-auto">
                  {(() => {
                    const sortedPlayers = [...players].sort((a, b) => a.playerNumber - b.playerNumber);
                    const allPairs = [];
                    
                    for (let i = 0; i < sortedPlayers.length; i++) {
                      for (let j = i + 1; j < sortedPlayers.length; j++) {
                        const p1 = sortedPlayers[i]!;
                        const p2 = sortedPlayers[j]!;
                        const key = `${Math.min(p1.memberId, p2.memberId)}-${Math.max(p1.memberId, p2.memberId)}`;
                        const count = pairCounts.get(key) || 0;
                        
                        allPairs.push({
                          key,
                          player1: p1,
                          player2: p2,
                          count,
                        });
                      }
                    }
                    
                    // Sort by count descending, then by player numbers for consistency
                    allPairs.sort((a, b) => {
                      if (b.count !== a.count) return b.count - a.count;
                      if (a.player1!.playerNumber !== b.player1!.playerNumber) {
                        return a.player1!.playerNumber - b.player1!.playerNumber;
                      }
                      return a.player2!.playerNumber - b.player2!.playerNumber;
                    });

                    if (allPairs.length === 0) {
                      return (
                        <div className="col-span-2 text-center text-gray-500 py-8">
                          参加者が不足しています
                        </div>
                      );
                    }

                    return allPairs.map(({ key, player1, player2, count }) => (
                      <div 
                        key={key} 
                        className={`flex items-center justify-between p-2 rounded border text-xs ${
                          count > 0 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span className={`inline-flex items-center justify-center w-4 h-4 text-xs font-semibold text-white rounded-full ${
                            count > 0 ? 'bg-blue-600' : 'bg-gray-400'
                          }`}>
                            {player1!.playerNumber}
                          </span>
                          <span className="text-xs text-gray-500">×</span>
                          <span className={`inline-flex items-center justify-center w-4 h-4 text-xs font-semibold text-white rounded-full ${
                            count > 0 ? 'bg-blue-600' : 'bg-gray-400'
                          }`}>
                            {player2!.playerNumber}
                          </span>
                        </div>
                        <span className={`text-xs font-medium ${
                          count > 0 ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                          {count}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
                
                <div className="flex gap-3 pt-4 mt-4 border-t">
                  <button
                    onClick={() => setShowPairStats(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
