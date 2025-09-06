'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SessionHeader } from '../../../../components/SessionHeader';
import { SessionSettings } from '../../../../components/SessionSettings';
import { PlayerManagement } from '../../../../components/PlayerManagement';
import { Button, ConfirmModal } from '../../../../components/ui';
import { useSessionStore } from '../../../../lib/stores/sessionStore';
import { usePlayerStore } from '../../../../lib/stores/playerStore';
import { useRoundStore } from '../../../../lib/stores/roundStore';

interface SetupPageProps {
  params: { id: string };
}

export default function SetupPage({ params }: SetupPageProps) {
  const router = useRouter();
  const { loadSession, currentSession } = useSessionStore();
  const { getActivePlayers, loadPlayersBySession } = usePlayerStore();
  const { generateRound, isLoading: isGeneratingRound } = useRoundStore();
  
  const [startModal, setStartModal] = useState(false);

  const sessionId = params.id;
  const activePlayers = getActivePlayers(sessionId);
  const canStartRound = activePlayers.length >= 4;

  useEffect(() => {
    const initializePage = async () => {
      try {
        await loadSession(sessionId);
        await loadPlayersBySession(sessionId);
      } catch (error) {
        console.error('Failed to load session data:', error);
        router.push('/');
      }
    };

    initializePage();
  }, [sessionId, loadSession, loadPlayersBySession, router]);

  const handleStartRound = async () => {
    if (!canStartRound) return;

    try {
      const round = await generateRound(sessionId);
      router.push(`/session/${sessionId}/round/${round.roundNo}` as any);
    } catch (error) {
      console.error('Failed to generate round:', error);
    }
  };

  const handleStartClick = () => {
    if (activePlayers.length < 8) {
      // Less than 8 players - show warning
      setStartModal(true);
    } else {
      handleStartRound();
    }
  };

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">セッション情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <SessionHeader 
          sessionId={sessionId}
          actions={
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {canStartRound ? (
                  <span className="text-green-600 font-medium">
                    開始準備完了 ({activePlayers.length}名参加)
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium">
                    最低4名必要 (現在{activePlayers.length}名)
                  </span>
                )}
              </div>
              
              <Button
                onClick={handleStartClick}
                disabled={!canStartRound || isGeneratingRound}
                loading={isGeneratingRound}
                size="lg"
                className="min-w-[140px]"
              >
                第1ラウンド開始
              </Button>
            </div>
          }
        />

        <div className="space-y-8">
          {/* Session Settings */}
          <SessionSettings sessionId={sessionId} />

          {/* Player Management */}
          <PlayerManagement sessionId={sessionId} />

          {/* Mobile Start Button */}
          <div className="block lg:hidden">
            <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0">
              <div className="mb-2 text-center text-sm">
                {canStartRound ? (
                  <span className="text-green-600 font-medium">
                    開始準備完了 ({activePlayers.length}名参加)
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium">
                    最低4名必要 (現在{activePlayers.length}名)
                  </span>
                )}
              </div>
              <Button
                onClick={handleStartClick}
                disabled={!canStartRound || isGeneratingRound}
                loading={isGeneratingRound}
                size="lg"
                fullWidth
              >
                第1ラウンド開始
              </Button>
            </div>
          </div>
        </div>

        {/* Start Confirmation Modal */}
        <ConfirmModal
          isOpen={startModal}
          onClose={() => setStartModal(false)}
          onConfirm={() => {
            setStartModal(false);
            handleStartRound();
          }}
          title="ラウンド開始"
          message={`現在の参加者数は${activePlayers.length}名です。一部のプレイヤーが連続して休憩になる可能性がありますが、開始しますか？`}
          confirmText="開始する"
          cancelText="キャンセル"
          loading={isGeneratingRound}
        />
      </div>
    </div>
  );
}