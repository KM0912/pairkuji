'use client';

import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const itemClass =
  'flex min-h-11 cursor-pointer items-center rounded-md px-3 text-left text-sm outline-none data-[highlighted]:bg-muted';

/** 休憩と早退。閉じる・フォーカス・画面端での位置はメニュー側に任せる。早退は確認してから実行する。 */
export function AvailabilityMenu({
  name,
  onBreak,
  onEarly,
  className,
  caption,
}: {
  name: string;
  onBreak: () => void;
  onEarly: () => void;
  className?: string;
  caption?: string;
}) {
  const [confirmEarly, setConfirmEarly] = useState(false);

  return (
    <DropdownMenu.Root
      onOpenChange={(open) => {
        if (!open) setConfirmEarly(false);
      }}
    >
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex min-h-11 min-w-11 items-center justify-center border-2 bg-white/90 text-foreground shadow-level-1',
            className
          )}
          aria-label={`${name}の休憩か早退を選ぶ`}
        >
          <MoreVertical className="h-4 w-4" />
          {caption && <span className="text-xs font-semibold">{caption}</span>}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="top"
          align="end"
          sideOffset={6}
          collisionPadding={12}
          className="z-toast min-w-[14rem] max-w-[calc(100vw-1.5rem)] rounded-lg border border-border bg-popover p-1 shadow-level-2"
          aria-label={`${name}の出場`}
        >
          {!confirmEarly ? (
            <>
              <DropdownMenu.Item className={itemClass} onSelect={() => onBreak()}>
                次の1ラウンドだけ休憩
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className={itemClass}
                onSelect={(event) => {
                  event.preventDefault();
                  setConfirmEarly(true);
                }}
              >
                早退
              </DropdownMenu.Item>
            </>
          ) : (
            <>
              <p role="alert" aria-live="assertive" className="px-3 py-2 text-sm text-foreground">
                早退にしますか？
              </p>
              <DropdownMenu.Item
                className={cn(itemClass, 'text-destructive')}
                onSelect={() => onEarly()}
              >
                早退にする
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className={itemClass}
                onSelect={(event) => {
                  event.preventDefault();
                  setConfirmEarly(false);
                }}
              >
                やめる
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
