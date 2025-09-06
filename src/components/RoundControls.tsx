'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, ConfirmModal } from './ui';
import { useRoundStore } from '../lib/stores/roundStore';
import { useSessionStore } from '../lib/stores/sessionStore';
import { useStatsStore } from '../lib/stores/statsStore';

interface RoundControlsProps {
  sessionId: string;
  roundNo: number;
}

export const RoundControls: React.FC<RoundControlsProps> = ({ 
  sessionId, 
  roundNo 
}) => {
  const router = useRouter();
  const { 
    currentRound, 
    generateRound, 
    confirmRound, 
    rollbackRound, 
    isLoading 
  } = useRoundStore();
  const { currentSession } = useSessionStore();
  const { updateStatsForRound } = useStatsStore();
  
  const [modals, setModals] = useState({
    confirm: false,
    rollback: false,
    regenerate: false,
  });

  const canConfirm = currentRound && currentRound.roundNo === roundNo;
  const canRollback = currentSession && currentSession.currentRound >= roundNo;
  const canRegenerate = currentRound && currentRound.roundNo === roundNo;

  const handleConfirmRound = async () => {
    if (!canConfirm || !currentRound) return;

    try {
      // Update stats first
      await updateStatsForRound(sessionId, currentRound);
      
      // Confirm the round
      await confirmRound(sessionId, roundNo);
      
      setModals(prev => ({ ...prev, confirm: false }));
      
      // Navigate to next round setup or results
      router.push(`/session/${sessionId}/setup` as any);
    } catch (error) {
      console.error('Failed to confirm round:', error);
    }
  };

  const handleRollbackRound = async () => {
    try {
      await rollbackRound(sessionId);
      setModals(prev => ({ ...prev, rollback: false }));
      
      // Navigate back to setup
      router.push(`/session/${sessionId}/setup` as any);
    } catch (error) {
      console.error('Failed to rollback round:', error);
    }
  };

  const handleRegenerateRound = async () => {
    try {
      await generateRound(sessionId);
      setModals(prev => ({ ...prev, regenerate: false }));
    } catch (error) {
      console.error('Failed to regenerate round:', error);
    }
  };

  const handleNextRound = async () => {
    try {
      const nextRound = await generateRound(sessionId);
      router.push(`/session/${sessionId}/round/${nextRound.roundNo}` as any);
    } catch (error) {
      console.error('Failed to generate next round:', error);
    }
  };

  return (
    <>
      <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {/* Primary Actions */}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setModals(prev => ({ ...prev, confirm: true }))}
                disabled={!canConfirm || isLoading}
                loading={isLoading}
                size="lg"
                className="min-w-[120px]"
              >
                ラウンド確定
              </Button>
              
              <Button
                onClick={handleNextRound}
                disabled={isLoading}
                variant="secondary"
                size="lg"
                className="min-w-[120px]"
              >
                次ラウンド生成
              </Button>
            </div>

            {/* Secondary Actions */}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setModals(prev => ({ ...prev, regenerate: true }))}
                disabled={!canRegenerate || isLoading}
                variant="outline"
                size="lg"
              >
                再生成
              </Button>
              
              <Button
                onClick={() => setModals(prev => ({ ...prev, rollback: true }))}
                disabled={!canRollback || isLoading}
                variant="outline"
                size="lg"
              >
                巻き戻し
              </Button>
            </div>
          </div>
          
          {/* Help Text */}
          <div className="mt-3 text-center text-sm text-gray-500">
            {!canConfirm && '組み合わせを確認してからラウンドを確定してください'}
            {canConfirm && 'ラウンドを確定すると統計が更新され、次のラウンドに進めます'}
          </div>
        </div>
      </div>

      {/* Confirm Round Modal */}
      <ConfirmModal
        isOpen={modals.confirm}
        onClose={() => setModals(prev => ({ ...prev, confirm: false }))}
        onConfirm={handleConfirmRound}
        title="ラウンド確定"
        message={`第${roundNo}ラウンドを確定しますか？確定後は統計が更新され、このラウンドの変更はできなくなります。`}
        confirmText="確定する"
        cancelText="キャンセル"
        loading={isLoading}
      />

      {/* Rollback Modal */}
      <ConfirmModal
        isOpen={modals.rollback}
        onClose={() => setModals(prev => ({ ...prev, rollback: false }))}
        onConfirm={handleRollbackRound}
        title="ラウンド巻き戻し"
        message={`第${roundNo}ラウンドを巻き戻しますか？このラウンドのデータは削除され、統計も前の状態に戻ります。`}
        confirmText="巻き戻す"
        cancelText="キャンセル"
        variant="danger"
        loading={isLoading}
      />

      {/* Regenerate Modal */}
      <ConfirmModal
        isOpen={modals.regenerate}
        onClose={() => setModals(prev => ({ ...prev, regenerate: false }))}
        onConfirm={handleRegenerateRound}
        title="ラウンド再生成"
        message="現在の組み合わせを破棄して新しい組み合わせを生成しますか？手動で行った変更も失われます。"
        confirmText="再生成する"
        cancelText="キャンセル"
        variant="danger"
        loading={isLoading}
      />
    </>
  );
};