'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, Button, Input } from './ui';
import { useSessionStore } from '../lib/stores/sessionStore';

export const NewSessionForm: React.FC = () => {
  const router = useRouter();
  const { createSession, isLoading, error } = useSessionStore();
  
  const [formData, setFormData] = useState({
    title: '',
    courts: 3,
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (formData.courts < 2 || formData.courts > 6) {
      errors.courts = 'コート数は2〜6の範囲で入力してください';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const sessionId = await createSession({
        title: formData.title.trim() || undefined,
        courts: formData.courts,
        currentRound: 0,
      });

      router.push(`/session/${sessionId}/setup` as any);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <h2 className="text-xl font-semibold text-center">新規セッション作成</h2>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="セッション名（任意）"
            placeholder="例：月曜練習"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            fullWidth
          />

          <Input
            label="コート数"
            type="number"
            min="2"
            max="6"
            value={formData.courts}
            onChange={(e) => handleInputChange('courts', parseInt(e.target.value) || 2)}
            error={formErrors.courts}
            helperText="使用するコート数を選択（2〜6）"
            fullWidth
          />

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            loading={isLoading}
            fullWidth
            size="lg"
          >
            セッションを作成
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};