'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '../../components/ui';
import { MemberManagement } from '../../components/MemberManagement';

export default function MembersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">選手管理</h1>
              <p className="text-gray-600 mt-2">
                練習に参加する選手を事前に登録・管理できます
              </p>
            </div>
            <Link href="/">
              <Button variant="outline">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                ホームへ戻る
              </Button>
            </Link>
          </div>
        </div>

        <MemberManagement />
      </div>
    </div>
  );
}