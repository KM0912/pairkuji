'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SessionHeader } from '../../../../components/SessionHeader';
import { ImportExportPanel } from '../../../../components/ImportExportPanel';
import { useSessionStore } from '../../../../lib/stores/sessionStore';
import { usePlayerStore } from '../../../../lib/stores/playerStore';
import { useRoundStore } from '../../../../lib/stores/roundStore';
import { useStatsStore } from '../../../../lib/stores/statsStore';

interface ExportPageProps {
  params: { id: string };
}

export default function ExportPage({ params }: ExportPageProps) {
  const router = useRouter();
  const sessionId = params.id;

  const { loadSession, currentSession } = useSessionStore();
  const { loadPlayersBySession } = usePlayerStore();
  const { loadRounds } = useRoundStore();
  const { loadStats } = useStatsStore();

  useEffect(() => {
    const initializePage = async () => {
      try {
        await Promise.all([
          loadSession(sessionId),
          loadPlayersBySession(sessionId),
          loadRounds(sessionId),
          loadStats(sessionId),
        ]);
      } catch (error) {
        console.error('Failed to load session data:', error);
        router.push('/');
      }
    };

    initializePage();
  }, [sessionId, loadSession, loadPlayersBySession, loadRounds, loadStats, router]);

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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <SessionHeader sessionId={sessionId} />

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">データ入出力</h1>
          <p className="text-gray-600">
            参加者データのインポートやセッションデータのエクスポートを行えます
          </p>
        </div>

        <ImportExportPanel sessionId={sessionId} />
      </div>
    </div>
  );
}