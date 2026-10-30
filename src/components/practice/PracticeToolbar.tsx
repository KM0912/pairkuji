import { MoreVertical, Swords, Users } from 'lucide-react';
import { PiCourtBasketball } from 'react-icons/pi';
import { Button } from '@/components/ui/button';

interface PracticeToolbarProps {
  roundCount: number;
  courts: number;
  activeCount: number;
  participantCount: number;
  onShowRounds: () => void;
  onShowCourts: () => void;
  onShowParticipants: () => void;
  onShowMenu: () => void;
}

export function PracticeToolbar({
  roundCount,
  courts,
  activeCount,
  participantCount,
  onShowRounds,
  onShowCourts,
  onShowParticipants,
  onShowMenu,
}: PracticeToolbarProps) {
  const items = [
    {
      label: 'ラウンド',
      value: roundCount,
      icon: <Swords className="size-4 text-foreground" aria-hidden />,
      ariaLabel: `ラウンド履歴: 全${roundCount}ラウンド`,
      onClick: onShowRounds,
    },
    {
      label: 'コート',
      value: courts,
      icon: <PiCourtBasketball className="size-4 text-foreground" aria-hidden />,
      ariaLabel: `コート数を変更: ${courts}コート`,
      onClick: onShowCourts,
    },
    {
      label: '参加者',
      value: `${activeCount}/${participantCount}`,
      icon: <Users className="size-4 text-foreground" aria-hidden />,
      ariaLabel: `参加者を管理: 出場できる人${activeCount}人、全体${participantCount}人`,
      onClick: onShowParticipants,
    },
  ];

  return (
    <div className="mb-3 flex h-11 items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {items.map((item) => (
          <Button
            key={item.label}
            type="button"
            variant="outline"
            onClick={item.onClick}
            aria-label={item.ariaLabel}
            title={item.ariaLabel}
            className="h-11 min-w-0 flex-auto gap-1.5 border border-border bg-card px-2 py-2 shadow-level-1 hover:border-primary/40 hover:bg-primary/5 active:bg-primary/10 sm:px-3"
          >
            {item.icon}
            <span className="hidden whitespace-nowrap text-sm font-medium text-foreground sm:inline">
              {item.label}
            </span>
            <span className="text-sm font-semibold leading-none tabular-nums text-primary">
              {item.value}
            </span>
          </Button>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onShowMenu}
        className="size-11 shrink-0 border border-border bg-card shadow-level-1 hover:border-primary/40 hover:bg-primary/5 active:bg-primary/10"
        aria-label="練習メニュー"
        title="練習メニュー"
      >
        <MoreVertical className="size-5" aria-hidden />
      </Button>
    </div>
  );
}
