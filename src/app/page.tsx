'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to practice screen immediately
    router.replace('/practice');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center w-full max-w-sm">
        <div
          className={`w-20 h-20 bg-primary rounded-3xl flex items-center justify-center shadow-2xl mb-8 mx-auto`}
        >
          <span className="text-primary-foreground font-bold text-3xl">P</span>
        </div>
        <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-primary mx-auto mb-6"></div>
        <p className="text-foreground font-semibold text-lg">
          🏸 ダブルス練習を始めましょう
        </p>
        <p className="text-muted-foreground text-sm mt-2">
          練習管理アプリを読み込み中...
        </p>
      </div>
    </div>
  );
}
