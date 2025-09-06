'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, Button, Input, Badge } from './ui';
import { useMemberStore } from '../lib/stores/memberStore';
import type { Member, SessionPlayer } from '../types';

interface SessionPlayerSelectionProps {
  sessionId: string;
}

export const SessionPlayerSelection: React.FC<SessionPlayerSelectionProps> = ({ sessionId }) => {
  const { 
    members, 
    sessionPlayers,
    loadAllMembers, 
    loadSessionPlayers,
    addPlayerToSession,
    removePlayerFromSession,
    updateSessionPlayerStatus,
    getMembersBySession,
    isLoading, 
    error 
  } = useMemberStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadAllMembers();
    loadSessionPlayers(sessionId);
  }, [loadAllMembers, loadSessionPlayers, sessionId]);

  const sessionMembersData = getMembersBySession(sessionId);
  const sessionMemberIds = sessionMembersData.map(data => data.member.id);
  
  const availableMembers = members.filter(member => 
    member.isActive && !sessionMemberIds.includes(member.id)
  );

  const filteredAvailableMembers = availableMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.tags && member.tags.some(tag => 
      tag.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  const displayedAvailableMembers = showAll 
    ? filteredAvailableMembers 
    : filteredAvailableMembers.slice(0, 10);

  const handleAddPlayer = async (memberId: number) => {
    try {
      await addPlayerToSession(sessionId, memberId);
    } catch (error) {
      console.error('Failed to add player to session:', error);
    }
  };

  const handleRemovePlayer = async (memberId: number) => {
    try {
      await removePlayerFromSession(sessionId, memberId);
    } catch (error) {
      console.error('Failed to remove player from session:', error);
    }
  };

  const handleStatusChange = async (memberId: number, status: SessionPlayer['status']) => {
    try {
      await updateSessionPlayerStatus(sessionId, memberId, status);
    } catch (error) {
      console.error('Failed to update player status:', error);
    }
  };

  const getStatusBadge = (status: SessionPlayer['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="sm">参加</Badge>;
      case 'rest':
        return <Badge variant="warning" size="sm">休憩</Badge>;
      case 'absent':
        return <Badge variant="default" size="sm">欠席</Badge>;
    }
  };

  const getStatusColor = (status: SessionPlayer['status']) => {
    switch (status) {
      case 'active':
        return 'border-green-200 bg-green-50';
      case 'rest':
        return 'border-yellow-200 bg-yellow-50';
      case 'absent':
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (isLoading && members.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Current Session Players */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">
            セッション参加者 ({sessionMembersData.length}名)
          </h3>
        </CardHeader>
        <CardContent>
          {sessionMembersData.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              参加者が選択されていません
            </p>
          ) : (
            <div className="space-y-3">
              {sessionMembersData.map(({ member, sessionPlayer }) => (
                <div
                  key={member.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${getStatusColor(sessionPlayer.status)}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-semibold text-gray-900">{member.name}</h4>
                      {getStatusBadge(sessionPlayer.status)}
                      {member.tags && member.tags.length > 0 && (
                        <div className="flex space-x-1">
                          {member.tags.map((tag) => (
                            <Badge key={tag} variant="default" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <select
                      value={sessionPlayer.status}
                      onChange={(e) => handleStatusChange(member.id, e.target.value as SessionPlayer['status'])}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                      disabled={isLoading}
                    >
                      <option value="active">参加</option>
                      <option value="rest">休憩</option>
                      <option value="absent">欠席</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemovePlayer(member.id)}
                      disabled={isLoading}
                    >
                      削除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              参加者追加 ({availableMembers.length}名から選択)
            </h3>
            {filteredAvailableMembers.length > 10 && !showAll && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(true)}
              >
                すべて表示 ({filteredAvailableMembers.length}名)
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="選手名またはタグで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
            />
          </div>

          {displayedAvailableMembers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {searchTerm ? '検索条件に一致する選手がいません' : '追加可能な選手がいません'}
            </p>
          ) : (
            <div className="space-y-3">
              {displayedAvailableMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-semibold text-gray-900">{member.name}</h4>
                      {member.tags && member.tags.length > 0 && (
                        <div className="flex space-x-1">
                          {member.tags.map((tag) => (
                            <Badge key={tag} variant="default" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddPlayer(member.id)}
                    disabled={isLoading}
                  >
                    追加
                  </Button>
                </div>
              ))}
            </div>
          )}

          {!showAll && filteredAvailableMembers.length > 10 && (
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">
                {filteredAvailableMembers.length - 10}名の選手が他にもいます
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {sessionMembersData.length > 0 && (
        <Card>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {sessionMembersData.filter(data => data.sessionPlayer.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600">参加予定</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {sessionMembersData.filter(data => data.sessionPlayer.status === 'rest').length}
                </div>
                <div className="text-sm text-gray-600">一時休憩</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {sessionMembersData.filter(data => data.sessionPlayer.status === 'absent').length}
                </div>
                <div className="text-sm text-gray-600">欠席</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};