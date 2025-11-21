'use client';

import Image from 'next/image';
import { HelpModal } from '../modals/help/HelpModal';
import { FeedbackForm } from '../modals/feedback/FeedbackForm';
import { Button } from '../ui/button';
import { HelpCircle, MessageSquare } from 'lucide-react';

interface HeaderProps {}

export function Header({}: HeaderProps) {
  return (
    <>
      <div className="sticky top-0 z-40 w-full">
        <div className={'bg-card/95 backdrop-blur-sm border-b border-border shadow-sm'}>
          <div className="h-16 flex items-center justify-between max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center">
                  <Image
                    src="/icon-192.png"
                    alt="ペアくじ"
                    width={36}
                    height={36}
                    className="rounded-lg"
                  />
                </div>
                <h1 className={'text-xl font-bold text-foreground'}>
                  ペアくじ
                </h1>
              </div>
              <span className={'text-sm font-medium text-muted-foreground hidden sm:inline'}>
                ダブルス練習管理
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex"
                asChild
              >
                <FeedbackForm />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex"
                asChild
              >
                <HelpModal />
              </Button>
              <div className="flex sm:hidden gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2"
                  asChild
                >
                  <FeedbackForm />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2"
                  asChild
                >
                  <HelpModal />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
