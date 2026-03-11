'use client';

import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { HelpModal } from '../modals/help/HelpModal';
import { FeedbackForm } from '../modals/feedback/FeedbackForm';

interface HeaderProps {}

export function Header({}: HeaderProps) {
  const pathname = usePathname();

  // LPページでは非表示
  if (pathname === '/') return null;

  return (
    <>
      <div className="sticky top-0 z-sticky w-full backdrop-blur-md bg-background/80 border-b border-border/50 shadow-level-1">
        <div className="h-14 flex items-center justify-between max-w-2xl mx-auto px-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Image
                  src="/icon-192.png"
                  alt="ペアくじ"
                  width={36}
                  height={36}
                  className="rounded-lg shadow-level-1"
                />
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-accent rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="font-heading text-xl font-bold text-foreground tracking-tight">
                  ペアくじ
                </h1>
                <span className="text-small text-muted-foreground hidden sm:block">
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
