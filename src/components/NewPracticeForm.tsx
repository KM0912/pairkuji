'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, Button, Input } from './ui';
import { usePracticeStore } from '../lib/stores/practiceStore';

export const NewPracticeForm: React.FC = () => {
  const router = useRouter();
  const { initializeNewPractice, isLoading, error } = usePracticeStore();
  
  const [formData, setFormData] = useState({
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
      await initializeNewPractice(formData.courts);
      router.push('/practice');
    } catch (error) {
      console.error('Failed to initialize new practice:', error);
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
        <h2 className="text-xl font-semibold text-center">新規練習開始</h2>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
            練習を開始
          </Button>
        </form>
        
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>注意:</strong> 新しい練習を開始すると、現在の練習データは削除されます。
          </p>
        </div>
      </CardContent>
    </Card>
  );
};