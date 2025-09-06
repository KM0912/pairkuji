'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Button, Badge, ConfirmModal } from './ui';
import { useSessionStore } from '../lib/stores/sessionStore';
import { usePlayerStore } from '../lib/stores/playerStore';

export const SessionList: React.FC = () => {
  const router = useRouter();
  const { sessions, loadAllSessions, deleteSession, isLoading, error } = useSessionStore();
  const { getPlayersBySession } = usePlayerStore();
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; sessionId: string | null }>({
    isOpen: false,
    sessionId: null,
  });
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  useEffect(() => {
    loadAllSessions();
  }, [loadAllSessions]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `今日 ${date.toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    } else if (diffDays === 1) {
      return `昨日 ${date.toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getSessionStatus = (currentRound: number) => {
    if (currentRound === 0) {
      return { label: '準備中', variant: 'warning' as const };
    } else {
      return { label: `${currentRound}ラウンド完了`, variant: 'success' as const };
    }
  };

  const handleContinueSession = (sessionId: string, currentRound: number) => {
    if (currentRound === 0) {
      router.push(`/session/${sessionId}/setup` as any);
    } else {
      router.push(`/session/${sessionId}/round/${currentRound + 1}` as any);
    }
  };

  const handleDeleteClick = (sessionId: string) => {
    setDeleteModal({ isOpen: true, sessionId });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.sessionId) return;

    try {
      setDeletingSessionId(deleteModal.sessionId);
      await deleteSession(deleteModal.sessionId);
      setDeleteModal({ isOpen: false, sessionId: null });
    } catch (error) {
      console.error('Failed to delete session:', error);
    } finally {
      setDeletingSessionId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">セッション一覧の読み込みに失敗しました</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-3"
          onClick={() => loadAllSessions()}
        >
          再試行
        </Button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1} 
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
              />
            </svg>
          </div>
          <p className="text-lg text-gray-500 mb-4">セッションがありません</p>
          <p className="text-gray-400">上記のフォームから新規セッションを作成してください</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">既存セッション</h2>
      
      {sessions.map((session) => {
        const status = getSessionStatus(session.currentRound);
        const playerCount = getPlayersBySession(session.id).length;

        return (
          <Card key={session.id} className="relative">
            <CardContent>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {session.title || `セッション ${session.id.slice(-6)}`}
                    </h3>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center space-x-4">
                      <span>コート: {session.courts}面</span>
                      <span>試合時間: {session.minutesPerGame}分</span>
                      <span>参加者: {playerCount}名</span>
                    </div>
                    <div>
                      更新日時: {formatDate(session.updatedAt)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-4">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleContinueSession(session.id, session.currentRound)}
                  className="flex-1"
                >
                  {session.currentRound === 0 ? '設定を続ける' : '試合を続ける'}
                </Button>
                
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => handleDeleteClick(session.id)}
                  loading={deletingSessionId === session.id}
                  disabled={deletingSessionId !== null}
                >
                  削除
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, sessionId: null })}
        onConfirm={handleDeleteConfirm}
        title="セッション削除"
        message="このセッションを削除しますか？この操作は取り消せません。"
        confirmText="削除"
        cancelText="キャンセル"
        variant="danger"
        loading={deletingSessionId !== null}
      />
    </div>
  );
};