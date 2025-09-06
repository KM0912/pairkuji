'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '../components/ui';
import { NewPracticeForm } from '../components/NewPracticeForm';
import { PracticeStatus } from '../components/PracticeStatus';
import { usePracticeStore } from '../lib/stores/practiceStore';

export default function HomePage() {
  const { settings, loadSettings, isLoading } = usePracticeStore();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadSettings();
  }, [loadSettings, refreshKey]);

  const handleResetPractice = () => {
    setRefreshKey(prev => prev + 1);
  };

  const showNewPracticeForm = !settings || !settings.startedAt;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">pairkuji</h1>
          <p className="text-xl text-gray-600">
            ダブルス練習試合の組み合わせ管理
          </p>
          <p className="text-gray-500 mt-2">
            公平な休憩時間で楽しい練習を
          </p>
          <div className="mt-6">
            <Link href="/members">
              <Button variant="outline" size="lg">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                選手管理
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex justify-center">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : showNewPracticeForm ? (
            <NewPracticeForm />
          ) : (
            <PracticeStatus onResetPractice={handleResetPractice} />
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-400 text-sm">
          <p>&copy; 2024 pairkuji. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}