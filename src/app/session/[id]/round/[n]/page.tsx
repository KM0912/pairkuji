'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SessionHeader } from '../../../../../components/SessionHeader';
import { CourtCard } from '../../../../../components/CourtCard';
import { RestPanel } from '../../../../../components/RestPanel';
import { RoundControls } from '../../../../../components/RoundControls';
import { useSessionStore } from '../../../../../lib/stores/sessionStore';
import { usePlayerStore } from '../../../../../lib/stores/playerStore';
import { useRoundStore } from '../../../../../lib/stores/roundStore';
import { useStatsStore } from '../../../../../lib/stores/statsStore';

interface RoundPageProps {
  params: { id: string; n: string };
}

export default function RoundPage({ params }: RoundPageProps) {
  const router = useRouter();
  const sessionId = params.id;
  const roundNo = parseInt(params.n);

  const { loadSession, currentSession } = useSessionStore();
  const { loadPlayersBySession } = usePlayerStore();
  const { 
    currentRound, 
    loadCurrentRound, 
    generateRound,
    isLoading: isRoundLoading 
  } = useRoundStore();
  const { loadStats } = useStatsStore();

  useEffect(() => {
    const initializePage = async () => {
      try {
        // Load session and player data
        await Promise.all([
          loadSession(sessionId),
          loadPlayersBySession(sessionId),
          loadStats(sessionId),
        ]);

        // Try to load existing round first
        await loadCurrentRound(sessionId, roundNo);
      } catch (error) {
        console.error('Failed to load page data:', error);
        router.push(`/session/${sessionId}/setup` as any);
      }
    };

    initializePage();
  }, [sessionId, roundNo, loadSession, loadPlayersBySession, loadCurrentRound, loadStats, router]);

  useEffect(() => {
    const generateRoundIfNeeded = async () => {
      // If no current round exists, generate one
      if (!isRoundLoading && !currentRound && currentSession) {
        try {
          await generateRound(sessionId);
        } catch (error) {
          console.error('Failed to generate round:', error);
          router.push(`/session/${sessionId}/setup` as any);
        }
      }
    };

    generateRoundIfNeeded();
  }, [currentRound, currentSession, isRoundLoading, generateRound, sessionId, router]);

  // Redirect if round number doesn't match current session state
  useEffect(() => {
    if (currentSession && currentRound) {
      const expectedRoundNo = currentSession.currentRound + 1;
      if (roundNo !== expectedRoundNo && roundNo !== currentRound.roundNo) {
        router.push(`/session/${sessionId}/round/${expectedRoundNo}` as any);
      }
    }
  }, [currentSession, currentRound, roundNo, sessionId, router]);

  if (!currentSession || !currentRound || isRoundLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isRoundLoading ? 'ラウンドを生成中...' : 'ラウンド情報を読み込み中...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <SessionHeader 
          sessionId={sessionId}
          showBackButton={false}
          actions={
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                第{roundNo}ラウンド
              </div>
            </div>
          }
        />

        <div className="space-y-8">
          {/* Courts Grid */}
          {currentRound.courts.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">対戦カード</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {currentRound.courts.map((court) => (
                  <CourtCard
                    key={court.courtNo}
                    court={court}
                    sessionId={sessionId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Rest Panel */}
          <RestPanel
            sessionId={sessionId}
            rests={currentRound.rests}
          />

          {/* Round Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {currentRound.courts.length}
                </div>
                <div className="text-sm text-gray-600">使用コート数</div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {currentRound.courts.length * 4}
                </div>
                <div className="text-sm text-gray-600">参加者数</div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {currentRound.rests.length}
                </div>
                <div className="text-sm text-gray-600">休憩者数</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Round Controls */}
      <RoundControls sessionId={sessionId} roundNo={roundNo} />
    </div>
  );
}