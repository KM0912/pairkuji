'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent, ActionSheet } from './ui';
import { usePlayerStore } from '../lib/stores/playerStore';
import { useRoundStore } from '../lib/stores/roundStore';
import type { CourtMatch } from '../types';

interface CourtCardProps {
  court: CourtMatch;
  sessionId: string;
  onPlayerSwap?: (playerId1: number, playerId2: number) => void;
}

export const CourtCard: React.FC<CourtCardProps> = ({ 
  court, 
  sessionId,
  onPlayerSwap 
}) => {
  const { getPlayersBySession } = usePlayerStore();
  const { swapPlayers, moveToRest } = useRoundStore();
  
  const [actionSheet, setActionSheet] = useState<{
    isOpen: boolean;
    playerId: number | null;
    playerName: string;
  }>({
    isOpen: false,
    playerId: null,
    playerName: '',
  });

  const players = getPlayersBySession(sessionId);
  const getPlayerName = (id: number) => {
    const player = players.find(p => p.id === id);
    return player?.name || `Player ${id}`;
  };

  const handlePlayerClick = (playerId: number) => {
    const playerName = getPlayerName(playerId);
    setActionSheet({
      isOpen: true,
      playerId,
      playerName,
    });
  };

  const handleMoveToRest = () => {
    if (actionSheet.playerId) {
      moveToRest(actionSheet.playerId);
      setActionSheet({ isOpen: false, playerId: null, playerName: '' });
    }
  };

  const getSwapCandidates = () => {
    const currentPlayerId = actionSheet.playerId;
    if (!currentPlayerId) return [];

    return players
      .filter(p => p.status === 'active' && p.id !== currentPlayerId)
      .map(p => ({
        label: `${p.name}と交代`,
        onClick: () => {
          swapPlayers(currentPlayerId, p.id);
          setActionSheet({ isOpen: false, playerId: null, playerName: '' });
        },
      }));
  };

  const actions = [
    {
      label: '休憩に移動',
      onClick: handleMoveToRest,
      variant: 'default' as const,
    },
    ...getSwapCandidates(),
  ];

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              コート {court.courtNo}
            </h3>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {/* Team 1 */}
            <TeamDisplay
              teamName="チーム A"
              players={court.team1}
              getPlayerName={getPlayerName}
              onPlayerClick={handlePlayerClick}
              teamColor="bg-blue-50 border-blue-200"
            />

            {/* VS Divider */}
            <div className="flex items-center justify-center py-2">
              <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full font-semibold text-sm">
                VS
              </div>
            </div>

            {/* Team 2 */}
            <TeamDisplay
              teamName="チーム B"
              players={court.team2}
              getPlayerName={getPlayerName}
              onPlayerClick={handlePlayerClick}
              teamColor="bg-green-50 border-green-200"
            />
          </div>
        </CardContent>
      </Card>

      <ActionSheet
        isOpen={actionSheet.isOpen}
        onClose={() => setActionSheet({ isOpen: false, playerId: null, playerName: '' })}
        title={`${actionSheet.playerName}の操作`}
        actions={actions}
      />
    </>
  );
};

interface TeamDisplayProps {
  teamName: string;
  players: [number, number];
  getPlayerName: (id: number) => string;
  onPlayerClick: (playerId: number) => void;
  teamColor: string;
}

const TeamDisplay: React.FC<TeamDisplayProps> = ({
  teamName,
  players,
  getPlayerName,
  onPlayerClick,
  teamColor,
}) => {
  return (
    <div className={`p-4 rounded-lg border-2 ${teamColor}`}>
      <h4 className="font-medium text-gray-700 mb-3 text-center text-sm">
        {teamName}
      </h4>
      <div className="space-y-2">
        {players.map((playerId, index) => (
          <button
            key={playerId}
            onClick={() => onPlayerClick(playerId)}
            className="w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="font-medium text-gray-900">
              {getPlayerName(playerId)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};