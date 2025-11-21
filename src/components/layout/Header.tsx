'use client';

import Image from 'next/image';
import { HelpModal } from '../modals/help/HelpModal';
import { FeedbackForm } from '../modals/feedback/FeedbackForm';

interface HeaderProps {}

export function Header({}: HeaderProps) {
  return (
    <>
      <div className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 border-b border-border/50 shadow-sm">
        <div className="h-16 flex items-center justify-between max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Image
                  src="/icon-192.png"
                  alt="ペアくじ"
                  width={36}
                  height={36}
                  className="rounded-lg shadow-sm"
                />
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-accent rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className={'text-xl font-bold text-foreground tracking-tight'}>
                  ペアくじ
                </h1>
                <span className={'text-xs text-muted-foreground hidden sm:block'}>
                  ダブルス練習管理
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <FeedbackForm />
            <HelpModal />
          </div>
        </div>
      </div>
    </>
  );
}
