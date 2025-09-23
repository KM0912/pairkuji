'use client';

import { useState } from 'react';
import { Settings, HelpCircle, MessageCircle } from 'lucide-react';
import { HelpModal } from '../help/HelpModal';
import { FeedbackForm } from '../feedback/FeedbackForm';

interface HeaderProps {}

export function Header({}: HeaderProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-40 w-full">
        <div className="bg-white border-b border-slate-200">
          <div className="h-14 flex items-center justify-between max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-800">🏸 ペアくじ</h1>
              <span className="text-slate-500 text-sm font-medium hidden sm:inline">
                - ダブルス練習
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
                aria-label="設定"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">設定</span>
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
                aria-label="フィードバック"
                onClick={() => setShowFeedback(true)}
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">フィードバック</span>
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
                aria-label="ヘルプ"
                onClick={() => setShowHelp(true)}
              >
                <HelpCircle className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">ヘルプ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <FeedbackForm
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
      />
    </>
  );
}
