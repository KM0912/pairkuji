'use client';

import React from 'react';
import { Card, CardHeader, CardContent, Badge } from './ui';
import { usePlayerStore } from '../lib/stores/playerStore';
import { useStatsStore } from '../lib/stores/statsStore';

interface RestPanelProps {
  sessionId: string;
  rests: number[];
}

export const RestPanel: React.FC<RestPanelProps> = ({ sessionId, rests }) => {
  const { getPlayersBySession } = usePlayerStore();
  const { getPlayerStats } = useStatsStore();
  
  const players = getPlayersBySession(sessionId);
  const getPlayerName = (id: number) => {
    const player = players.find(p => p.id === id);
    return player?.name || `Player ${id}`;
  };

  const getPlayerRestInfo = (playerId: number) => {
    const stats = getPlayerStats(sessionId, playerId);
    return {
      totalRests: stats?.restCount || 0,
      consecutiveRests: stats?.consecRest || 0,
    };
  };

  if (rests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">休憩者</h3>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1a3 3 0 000-6h-1m1 6V4a3 3 0 000-6M16 14v.01M12 16v.01M8 16v.01M16 10v.01M12 8v.01M8 8v.01" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">休憩者なし</p>
            <p className="text-gray-400 text-sm">全員が試合に参加中です</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">休憩者</h3>
          <Badge variant="info" size="sm">
            {rests.length}名
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rests.map((playerId) => {
            const restInfo = getPlayerRestInfo(playerId);
            const isConsecutive = restInfo.consecutiveRests > 1;
            
            return (
              <div
                key={playerId}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  isConsecutive
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 flex-1 truncate">
                    {getPlayerName(playerId)}
                  </h4>
                  {isConsecutive && (
                    <Badge variant="warning" size="sm">
                      連続
                    </Badge>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>総休憩回数:</span>
                    <span className="font-medium">{restInfo.totalRests + 1}回</span>
                  </div>
                  {isConsecutive && (
                    <div className="flex justify-between text-amber-700">
                      <span>連続休憩:</span>
                      <span className="font-medium">{restInfo.consecutiveRests + 1}回</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        {rests.some(id => getPlayerRestInfo(id).consecutiveRests > 1) && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-amber-800">
                  連続休憩者がいます
                </h4>
                <p className="text-sm text-amber-700 mt-1">
                  次のラウンドでは優先的に試合に参加させることを検討してください。
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};