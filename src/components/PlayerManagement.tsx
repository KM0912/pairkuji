'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, Button, Input, StatusBadge, Sheet } from './ui';
import { usePlayerStore } from '../lib/stores/playerStore';
import { useStatsStore } from '../lib/stores/statsStore';

interface PlayerManagementProps {
  sessionId: string;
}

export const PlayerManagement: React.FC<PlayerManagementProps> = ({ sessionId }) => {
  const { 
    players, 
    getPlayersBySession, 
    getActivePlayers,
    addPlayer, 
    updatePlayerStatus, 
    removePlayer, 
    searchPlayers,
    loadPlayersBySession,
    isLoading, 
    error 
  } = usePlayerStore();
  
  const { initializePlayerStats } = useStatsStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [addPlayerSheetOpen, setAddPlayerSheetOpen] = useState(false);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);

  const sessionPlayers = searchQuery
    ? searchPlayers(sessionId, searchQuery)
    : getPlayersBySession(sessionId);
    
  const activePlayers = getActivePlayers(sessionId);

  useEffect(() => {
    loadPlayersBySession(sessionId);
  }, [sessionId, loadPlayersBySession]);

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return;

    try {
      setIsAddingPlayer(true);
      const playerId = await addPlayer(sessionId, newPlayerName.trim());
      await initializePlayerStats(sessionId, playerId);
      
      setNewPlayerName('');
      setAddPlayerSheetOpen(false);
    } catch (error) {
      console.error('Failed to add player:', error);
    } finally {
      setIsAddingPlayer(false);
    }
  };

  const handleStatusChange = async (playerId: number, newStatus: 'active' | 'rest' | 'absent') => {
    try {
      await updatePlayerStatus(playerId, newStatus);
    } catch (error) {
      console.error('Failed to update player status:', error);
    }
  };

  const handleRemovePlayer = async (playerId: number) => {
    if (window.confirm('このプレイヤーを削除しますか？')) {
      try {
        await removePlayer(playerId);
      } catch (error) {
        console.error('Failed to remove player:', error);
      }
    }
  };

  const getPlayersByStatus = (status: 'active' | 'rest' | 'absent') => {
    return sessionPlayers.filter(player => player.status === status);
  };

  if (isLoading && sessionPlayers.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            参加者情報を読み込み中...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">参加者管理</h2>
            <div className="text-sm text-gray-600">
              参加中: {activePlayers.length}名 / 総数: {sessionPlayers.length}名
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="参加者を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
                startIcon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
              <Button
                onClick={() => setAddPlayerSheetOpen(true)}
                className="whitespace-nowrap"
              >
                参加者を追加
              </Button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Player Lists */}
            {sessionPlayers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <p className="text-lg text-gray-500 mb-4">参加者がまだいません</p>
                <p className="text-gray-400">「参加者を追加」ボタンから追加してください</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Active Players */}
                {getPlayersByStatus('active').length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">参加中</h3>
                    <PlayerGrid 
                      players={getPlayersByStatus('active')} 
                      onStatusChange={handleStatusChange}
                      onRemove={handleRemovePlayer}
                    />
                  </div>
                )}

                {/* Resting Players */}
                {getPlayersByStatus('rest').length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">休憩中</h3>
                    <PlayerGrid 
                      players={getPlayersByStatus('rest')} 
                      onStatusChange={handleStatusChange}
                      onRemove={handleRemovePlayer}
                    />
                  </div>
                )}

                {/* Absent Players */}
                {getPlayersByStatus('absent').length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">離席中</h3>
                    <PlayerGrid 
                      players={getPlayersByStatus('absent')} 
                      onStatusChange={handleStatusChange}
                      onRemove={handleRemovePlayer}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Player Sheet */}
      <Sheet 
        isOpen={addPlayerSheetOpen} 
        onClose={() => setAddPlayerSheetOpen(false)}
        title="参加者を追加"
      >
        <div className="space-y-4">
          <Input
            label="参加者名"
            placeholder="参加者名を入力"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newPlayerName.trim()) {
                handleAddPlayer();
              }
            }}
            fullWidth
            autoFocus
          />
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setAddPlayerSheetOpen(false)}
              fullWidth
            >
              キャンセル
            </Button>
            <Button
              onClick={handleAddPlayer}
              loading={isAddingPlayer}
              disabled={!newPlayerName.trim()}
              fullWidth
            >
              追加
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
};

interface PlayerGridProps {
  players: Array<{ id: number; name: string; status: 'active' | 'rest' | 'absent' }>;
  onStatusChange: (playerId: number, status: 'active' | 'rest' | 'absent') => void;
  onRemove: (playerId: number) => void;
}

const PlayerGrid: React.FC<PlayerGridProps> = ({ players, onStatusChange, onRemove }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {players.map((player) => (
        <div key={player.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-medium text-gray-900 flex-1 truncate">{player.name}</h4>
            <StatusBadge status={player.status} size="sm" />
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={player.status}
              onChange={(e) => onStatusChange(player.id, e.target.value as any)}
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">参加中</option>
              <option value="rest">休憩</option>
              <option value="absent">離席</option>
            </select>
            
            <button
              onClick={() => onRemove(player.id)}
              className="text-red-600 hover:text-red-700 p-1"
              title="削除"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};