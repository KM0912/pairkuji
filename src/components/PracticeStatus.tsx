'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, Button, ConfirmModal } from './ui';
import { usePracticeStore } from '../lib/stores/practiceStore';

interface PracticeStatusProps {
  onResetPractice: () => void;
}

export const PracticeStatus: React.FC<PracticeStatusProps> = ({ onResetPractice }) => {
  const router = useRouter();
  const { 
    settings, 
    loadSettings,
    loadAllMembers, 
    getActivePlayerCount, 
    resetPractice,
    isLoading, 
    error 
  } = usePracticeStore();
  
  const [resetModal, setResetModal] = React.useState(false);

  useEffect(() => {
    loadSettings();
    loadAllMembers();
  }, [loadSettings, loadAllMembers]);

  const handleContinuePractice = () => {
    if (settings) {
      if (settings.currentRound === 0) {
        router.push('/practice');
      } else {
        router.push(`/practice/round/${settings.currentRound + 1}` as any);
      }
    }
  };

  const handleResetConfirm = async () => {
    try {
      await resetPractice();
      setResetModal(false);
      onResetPractice();
    } catch (error) {
      console.error('Failed to reset practice:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!settings || !settings.startedAt) {
    return null;
  }

  const activePlayerCount = getActivePlayerCount();
  const canContinue = activePlayerCount >= 4;
  const startedAt = new Date(settings.startedAt);

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader>
          <h2 className="text-xl font-semibold text-center">練習中</h2>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold text-blue-600">
              {settings.currentRound}ラウンド完了
            </div>
            <div className="text-sm text-gray-600">
              {settings.courts}コート使用
            </div>
            <div className="text-sm text-gray-600">
              開始時刻: {startedAt.toLocaleTimeString('ja-JP', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-sm">
              <span>参加者数:</span>
              <span className={canContinue ? 'text-green-600 font-medium' : 'text-amber-600'}>
                {activePlayerCount}名
              </span>
            </div>
            {!canContinue && (
              <p className="text-xs text-amber-600 mt-1">
                最低4名必要です
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-xs">{error}</p>
            </div>
          )}

          <div className="flex flex-col space-y-2">
            <Button
              onClick={handleContinuePractice}
              disabled={!canContinue}
              fullWidth
              size="lg"
            >
              {settings.currentRound === 0 ? '参加者設定' : '練習を続ける'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setResetModal(true)}
              fullWidth
            >
              練習を終了してリセット
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={resetModal}
        onClose={() => setResetModal(false)}
        onConfirm={handleResetConfirm}
        title="練習終了"
        message="現在の練習を終了してすべてのデータをリセットしますか？この操作は取り消せません。"
        confirmText="終了してリセット"
        cancelText="キャンセル"
        variant="danger"
        loading={isLoading}
      />
    </>
  );
};