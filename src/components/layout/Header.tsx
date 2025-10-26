'use client';

import Image from 'next/image';
import { HelpModal } from '../modals/help/HelpModal';
import { FeedbackForm } from '../modals/feedback/FeedbackForm';

interface HeaderProps {}

export function Header({}: HeaderProps) {
  return (
    <>
      <div className="sticky top-0 z-40 w-full">
        <div className={'bg-secondary border-b border-border'}>
          <div className="h-14 flex items-center justify-between max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Image
                  src="/icon-192.png"
                  alt="ペアくじ"
                  width={32}
                  height={32}
                  className="rounded-md"
                />
                <h1 className={'text-xl font-bold text-foreground'}>
                  ペアくじ
                </h1>
              </div>
              <span className={'text-sm font-medium hidden sm:inline'}>
                - ダブルス練習
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FeedbackForm />
              <HelpModal />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
