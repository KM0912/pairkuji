'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMemberStore } from '@/lib/stores/memberStore';
import { usePracticeStore } from '@/lib/stores/practiceStore';
import { db } from '@/lib/db';
import { Spinner } from '@/components/ui/spinner';
import { WinRatePanel } from '@/components/stats/WinRatePanel';
import { calculateWinRates } from '@/lib/winRateCalculator';
import { ArrowLeft, Trophy, Tag, X, Plus, Trash2 } from 'lucide-react';
import { PiCourtBasketball } from 'react-icons/pi';
import { IconBadge } from '@/components/ui/IconBadge';
import { cn, getDisplayName } from '@/lib/utils';
import { getUniqueTags } from '@/lib/statsCalculator';
import type { PracticeSession } from '@/types/practiceSession';
import type { MatchResult } from '@/types/round';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const {
    allMembers,
    isLoading: membersLoading,
    isInitialLoad: membersInitialLoad,
    loadAll: loadAllMembers,
  } = useMemberStore();

  const {
    sessions,
    loadSessions,
    updateSessionResult,
    updateSessionTags,
    deleteSessionCourt,
    deleteSession,
  } = usePracticeStore();

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<
    | { type: 'session' }
    | { type: 'court'; roundNo: number; courtNo: number }
    | null
  >(null);
  const [tagInput, setTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  const sessionId = Number(params.id);

  const loadSession = useCallback(() => {
    if (!isNaN(sessionId)) {
      db.practiceSessions
        .get(sessionId)
        .then((data) => {
          setSession(data ?? null);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadAllMembers();
    loadSessions();
    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const memberMap = useMemo(
    () => new Map(allMembers.map((m) => [m.id!, m])),
    [allMembers]
  );

  const winRates = useMemo(() => {
    if (!session) return new Map();
    return calculateWinRates(session.rounds);
  }, [session]);

  const pastTags = useMemo(() => getUniqueTags(sessions), [sessions]);

  const availablePastTags = useMemo(() => {
    const currentTags = session?.clubTags ?? [];
    return pastTags.filter((t) => !currentTags.includes(t));
  }, [pastTags, session?.clubTags]);

  const tagSuggestions = useMemo(() => {
    if (!tagInput.trim()) return availablePastTags;
    const term = tagInput.trim().toLowerCase();
    return availablePastTags.filter((tag) =>
      tag.toLowerCase().includes(term)
    );
  }, [availablePastTags, tagInput]);

  const handleResultToggle = async (roundNo: number, courtNo: number, currentResult: MatchResult | undefined) => {
    if (!session?.id) return;
    const cycle: MatchResult[] = ['pairA', 'pairB', null];
    const currentIndex = cycle.indexOf(currentResult ?? null);
    const nextResult = cycle[(currentIndex + 1) % cycle.length] ?? null;

    await updateSessionResult(session.id, roundNo, courtNo, nextResult);
    loadSession();
  };

  const handleAddTag = async (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || !session?.id) return;
    const currentTags = session.clubTags ?? [];
    if (currentTags.includes(trimmed)) return;
    await updateSessionTags(session.id, [...currentTags, trimmed]);
    setTagInput('');
    setIsAddingTag(false);
    loadSession();
  };

  const handleRemoveTag = async (tag: string) => {
    if (!session?.id) return;
    const currentTags = session.clubTags ?? [];
    await updateSessionTags(
      session.id,
      currentTags.filter((t) => t !== tag)
    );
    loadSession();
  };

  const handleDeleteCourt = async () => {
    if (!session?.id || !deleteConfirm || deleteConfirm.type !== 'court') return;
    await deleteSessionCourt(session.id, deleteConfirm.roundNo, deleteConfirm.courtNo);
    setDeleteConfirm(null);
    loadSession();
  };

  const handleDeleteSession = async () => {
    if (!session?.id) return;
    await deleteSession(session.id);
    setDeleteConfirm(null);
    router.push('/history');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tagInput.trim()) {
        handleAddTag(tagInput);
      }
    } else if (e.key === 'Escape') {
      setTagInput('');
      setIsAddingTag(false);
    }
  };

  if (isLoading || membersLoading || !membersInitialLoad) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="size-8" />
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">セッションが見つかりません。</p>
          <button
            className="mt-4 text-primary underline"
            onClick={() => router.push('/history')}
          >
            履歴に戻る
          </button>
        </div>
      </div>
    );
  }

  const startDate = new Date(session.startedAt);
  const endDate = new Date(session.endedAt);

  return (
    <div className="bg-background">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-4">
        <button
          className="p-2 rounded-lg hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={() => router.push('/history')}
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-bold text-foreground">
            {startDate.toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </h1>
          <p className="text-xs text-muted-foreground">
            {startDate.toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            〜
            {endDate.toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            ・{session.courts}面・{session.playerIds.length}人
          </p>
        </div>
      </div>

      {/* タグ編集 */}
      <div className="mb-4">
        <div className="flex items-center gap-1 flex-wrap">
          {(session.clubTags ?? []).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium"
            >
              <Tag className="w-3 h-3" />
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                aria-label={`${tag}を削除`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {!isAddingTag && availablePastTags.length > 0 &&
            availablePastTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleAddTag(tag)}
                className="inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/50 text-muted-foreground px-2 py-1 text-xs font-medium hover:bg-muted hover:text-foreground transition-colors"
              >
                <Plus className="w-3 h-3" />
                {tag}
              </button>
            ))}
          {isAddingTag ? (
            <div className="relative">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => {
                  if (tagInput.trim()) {
                    handleAddTag(tagInput);
                  } else {
                    setIsAddingTag(false);
                  }
                }}
                placeholder="タグ名を入力"
                className="border rounded-lg px-2.5 py-1 bg-card border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary min-h-[28px] w-32"
                aria-label="新しいタグ"
                autoFocus
              />
              {tagSuggestions.length > 0 && tagInput.trim() && (
                <ul className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-level-2 max-h-32 overflow-y-auto">
                  {tagSuggestions.map((tag) => (
                    <li key={tag}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleAddTag(tag)}
                      >
                        {tag}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingTag(true)}
              className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <Plus className="w-3.5 h-3.5" />
              タグ追加
            </button>
          )}
        </div>
      </div>

      {/* 勝率サマリ */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          勝率
        </h2>
        <WinRatePanel memberMap={memberMap} winRates={winRates} />
      </div>

      {/* ラウンド詳細 */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          ラウンド詳細
        </h2>
        <div className="space-y-4">
          {session.rounds.map((round) => (
            <div key={round.roundNo}>
              <div className="text-xs font-bold text-foreground mb-2">
                ラウンド {round.roundNo}
              </div>
              <div className="space-y-2">
                {round.courts.map((court) => (
                  <div
                    key={court.courtNo}
                    className="rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <IconBadge
                        icon={PiCourtBasketball}
                        size="sm"
                        className="text-primary"
                      />
                      <span className="text-xs font-semibold text-foreground">
                        COURT {court.courtNo}
                      </span>
                      <button
                        className={cn(
                          'text-xs ml-auto min-h-[44px] px-2 py-0.5 rounded-md transition-colors',
                          court.result != null
                            ? 'text-accent hover:bg-accent/10'
                            : 'text-muted-foreground hover:bg-muted'
                        )}
                        onClick={() =>
                          handleResultToggle(
                            round.roundNo,
                            court.courtNo,
                            court.result
                          )
                        }
                        aria-label="勝敗を変更"
                      >
                        <Trophy className="w-3 h-3 inline-block mr-0.5" />
                        {court.result === 'pairA'
                          ? '左'
                          : court.result === 'pairB'
                            ? '右'
                            : '未記録'}
                      </button>
                      <button
                        className="text-muted-foreground hover:text-destructive transition-colors p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        onClick={() =>
                          setDeleteConfirm({
                            type: 'court',
                            roundNo: round.roundNo,
                            courtNo: court.courtNo,
                          })
                        }
                        aria-label="試合を削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'flex-1 rounded-md border p-2 text-xs',
                          court.result === 'pairA'
                            ? 'border-accent/50 bg-accent/10'
                            : 'border-border bg-muted/30'
                        )}
                      >
                        {court.pairA
                          .map((id) => getDisplayName(memberMap, id))
                          .join(' / ')}
                      </div>
                      <span className="text-xs text-muted-foreground font-bold">
                        vs
                      </span>
                      <div
                        className={cn(
                          'flex-1 rounded-md border p-2 text-xs',
                          court.result === 'pairB'
                            ? 'border-accent/50 bg-accent/10'
                            : 'border-border bg-muted/30'
                        )}
                      >
                        {court.pairB
                          .map((id) => getDisplayName(memberMap, id))
                          .join(' / ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* セッション削除ボタン */}
      <div className="mt-8 pb-4">
        <button
          className="w-full flex items-center justify-center gap-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg py-3 transition-colors min-h-[44px]"
          onClick={() => setDeleteConfirm({ type: 'session' })}
        >
          <Trash2 className="w-4 h-4" />
          この練習を削除
        </button>
      </div>

      {/* 削除確認ダイアログ */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-modal bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border-2 border-border p-6 max-w-sm w-full shadow-level-3">
            <h3 className="text-sm font-bold text-foreground mb-2">
              {deleteConfirm.type === 'session'
                ? 'この練習を削除しますか？'
                : 'この試合を削除しますか？'}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {deleteConfirm.type === 'session'
                ? 'この練習のすべてのデータが削除されます。この操作は取り消せません。'
                : 'この試合が削除されます。ラウンド内の最後の試合の場合、ラウンドごと削除されます。'}
            </p>
            <div className="flex gap-2">
              <button
                className="flex-1 text-sm py-2.5 rounded-lg border border-border hover:bg-muted transition-colors min-h-[44px]"
                onClick={() => setDeleteConfirm(null)}
              >
                キャンセル
              </button>
              <button
                className="flex-1 text-sm py-2.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors min-h-[44px]"
                onClick={
                  deleteConfirm.type === 'session'
                    ? handleDeleteSession
                    : handleDeleteCourt
                }
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
