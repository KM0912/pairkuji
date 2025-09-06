'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../components/ui';
import { PracticePlayerSelection } from '../../components/PracticePlayerSelection';
import { PracticeSettings } from '../../components/PracticeSettings';
import { usePracticeStore } from '../../lib/stores/practiceStore';

export default function PracticePage() {
  const router = useRouter();
  const { 
    settings, 
    loadSettings,
    loadAllMembers, 
    loadPracticePlayers,
    getActivePlayerCount,
    isLoading 
  } = usePracticeStore();
  
  const activePlayerCount = getActivePlayerCount();
  const canStartRound = activePlayerCount >= 4;

  useEffect(() => {
    const initializePage = async () => {
      try {
        await loadSettings();
        await loadAllMembers();
        await loadPracticePlayers();
      } catch (error) {
        console.error('Failed to load practice data:', error);
        router.push('/');
      }
    };

    initializePage();
  }, [loadSettings, loadAllMembers, loadPracticePlayers, router]);

  const handleStartRound = () => {
    if (!settings) return;
    
    const nextRound = settings.currentRound + 1;
    router.push(`/practice/round/${nextRound}` as any);
  };

  if (isLoading && !settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">練習情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">練習が見つかりません</p>
          <Link href="/">
            <Button variant="outline">ホームに戻る</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  戻る
                </Button>
              </Link>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  練習設定
                </h1>
                <p className="text-gray-600">
                  {settings.courts}コート
                  {settings.currentRound > 0 && ` • ${settings.currentRound}ラウンド完了`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {canStartRound ? (
                  <span className="text-green-600 font-medium">
                    開始準備完了 ({activePlayerCount}名参加)
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium">
                    最低4名必要 (現在{activePlayerCount}名)
                  </span>
                )}
              </div>
              
              <Button
                onClick={handleStartRound}
                disabled={!canStartRound}
                size="lg"
                className="min-w-[140px]"
              >
                第{settings.currentRound + 1}ラウンド開始
              </Button>
            </div>
          </div>
        </header>

        <div className="space-y-8">
          {/* Practice Settings */}
          <PracticeSettings />

          {/* Practice Player Selection */}
          <PracticePlayerSelection />

          {/* Mobile Start Button */}
          <div className="block lg:hidden">
            <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0">
              <div className="mb-2 text-center text-sm">
                {canStartRound ? (
                  <span className="text-green-600 font-medium">
                    開始準備完了 ({activePlayerCount}名参加)
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium">
                    最低4名必要 (現在{activePlayerCount}名)
                  </span>
                )}
              </div>
              <Button
                onClick={handleStartRound}
                disabled={!canStartRound}
                size="lg"
                fullWidth
              >
                第{settings.currentRound + 1}ラウンド開始
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}