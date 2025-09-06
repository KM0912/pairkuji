'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, Input, Button } from './ui';
import { useSessionStore } from '../lib/stores/sessionStore';

interface SessionSettingsProps {
  sessionId: string;
}

export const SessionSettings: React.FC<SessionSettingsProps> = ({ sessionId }) => {
  const { currentSession, updateSession, isLoading, error } = useSessionStore();
  
  const [formData, setFormData] = useState({
    title: '',
    courts: 3,
    minutesPerGame: 15,
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (currentSession && currentSession.id === sessionId) {
      setFormData({
        title: currentSession.title || '',
        courts: currentSession.courts,
        minutesPerGame: currentSession.minutesPerGame,
      });
    }
  }, [currentSession, sessionId]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (formData.courts < 2 || formData.courts > 6) {
      errors.courts = 'コート数は2〜6の範囲で入力してください';
    }

    if (formData.minutesPerGame < 5 || formData.minutesPerGame > 60) {
      errors.minutesPerGame = '1試合時間は5〜60分の範囲で入力してください';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: string | number) => {
    const newValue = field === 'title' ? value : Number(value);
    
    setFormData(prev => ({ ...prev, [field]: newValue }));
    setHasChanges(true);
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      await updateSession(sessionId, {
        title: formData.title.trim() || undefined,
        courts: formData.courts,
        minutesPerGame: formData.minutesPerGame,
      });
      
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  };

  const handleReset = () => {
    if (currentSession && currentSession.id === sessionId) {
      setFormData({
        title: currentSession.title || '',
        courts: currentSession.courts,
        minutesPerGame: currentSession.minutesPerGame,
      });
      setHasChanges(false);
      setFormErrors({});
    }
  };

  if (!currentSession) {
    return (
      <Card>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            セッション情報を読み込み中...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">セッション設定</h2>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <Input
            label="セッション名（任意）"
            placeholder="例：月曜練習"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            fullWidth
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="コート数"
              type="number"
              min="2"
              max="6"
              value={formData.courts}
              onChange={(e) => handleInputChange('courts', parseInt(e.target.value) || 2)}
              error={formErrors.courts}
              helperText="使用するコート数（2〜6）"
              fullWidth
            />

            <Input
              label="1試合時間（分）"
              type="number"
              min="5"
              max="60"
              value={formData.minutesPerGame}
              onChange={(e) => handleInputChange('minutesPerGame', parseInt(e.target.value) || 15)}
              error={formErrors.minutesPerGame}
              helperText="1試合の時間（5〜60分）"
              fullWidth
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {hasChanges && (
            <div className="flex space-x-3 justify-end">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
              >
                リセット
              </Button>
              <Button
                onClick={handleSave}
                loading={isLoading}
              >
                設定を保存
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};