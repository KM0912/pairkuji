'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, Input, Button } from './ui';
import { usePracticeStore } from '../lib/stores/practiceStore';

export const PracticeSettings: React.FC = () => {
  const { settings, updateSettings, isLoading, error } = usePracticeStore();
  
  const [formData, setFormData] = useState({
    courts: 3,
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        courts: settings.courts,
      });
    }
  }, [settings]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (formData.courts < 2 || formData.courts > 6) {
      errors.courts = 'コート数は2〜6の範囲で入力してください';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: string | number) => {
    const newValue = field === 'courts' ? Number(value) : value;
    
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
      await updateSettings({
        courts: formData.courts,
      });
      
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const handleReset = () => {
    if (settings) {
      setFormData({
        courts: settings.courts,
      });
      setHasChanges(false);
      setFormErrors({});
    }
  };

  if (!settings) {
    return (
      <Card>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            練習設定を読み込み中...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">練習設定</h2>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
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