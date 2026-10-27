import React from 'react';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test, vi } from 'vitest';
import { buttonVariants } from '@/components/ui/button';
import {
  DIALOG_CLOSE_LABEL,
  dialogCloseClass,
  dialogContentBaseClass,
} from '@/components/ui/dialog';
import { SelectTile } from '@/components/ui/SelectTile';
import { SubstitutionHint } from '@/components/practice/SubstitutionHint';
import { CourtManagement } from '@/components/practice/CourtManagement';
import { ParticipantSelection } from '@/components/practice/ParticipantSelection';
import { Dialog } from '@/components/ui/dialog';
import { HelpBody } from '@/components/modals/help/HelpModal';
import {
  MERGE_SUMMARY,
  OVERWRITE_SUMMARY,
  substitutionToast,
} from '@/lib/practiceLabels';
import type { Member } from '@/types/member';
import type { PracticePlayer } from '@/types/practice';
import type { Round } from '@/types/round';

vi.mock('next/navigation', () => ({
  usePathname: () => '/practice',
  useRouter: () => ({ push: () => undefined }),
}));

import { BottomNavigation } from '@/components/layout/BottomNavigation';

function member(id: number, name: string): Member {
  return {
    id,
    name,
    isActive: true,
    isDeleted: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function player(
  memberId: number,
  playerNumber: number,
  status: PracticePlayer['status'] = 'active',
  restKind?: PracticePlayer['restKind']
): PracticePlayer {
  return {
    memberId,
    playerNumber,
    status,
    restKind,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

const round: Round = {
  roundNo: 1,
  courts: [{ courtNo: 1, pairA: [1, 2], pairB: [3, 4], result: 'pairA' }],
  rests: [5],
};

describe('タッチ領域とダイアログ', () => {
  test('小さいボタンと閉じる操作は 44px 以上', () => {
    expect(buttonVariants({ size: 'sm' })).toContain('min-h-11');
    expect(buttonVariants({ size: 'sm' })).not.toContain('h-8');
    expect(dialogCloseClass).toContain('h-11');
    expect(dialogCloseClass).toContain('w-11');
    expect(dialogCloseClass).not.toContain('bg-accent');
    expect(DIALOG_CLOSE_LABEL).toBe('閉じる');
    expect(dialogContentBaseClass).toContain('max-h-[90dvh]');
    expect(dialogContentBaseClass).toContain('overflow-y-auto');
    expect(dialogContentBaseClass).toContain('top-1/2');
    expect(dialogContentBaseClass).not.toContain('top-[35%]');
  });

  test('選択タイルのフォーカスリングは薄い primary ではない', () => {
    const html = renderToStaticMarkup(<SelectTile>山田</SelectTile>);
    expect(html).toContain('ring-ring');
    expect(html).not.toContain('ring-primary/20');
  });
});

describe('練習画面の文言', () => {
  test('入れ替えの説明と、待機と次の休憩を分ける', () => {
    const hint = renderToStaticMarkup(
      <SubstitutionHint
        substituting={1}
        memberMap={new Map([[1, member(1, '山田')]])}
        playerMap={new Map([[1, player(1, 1)]])}
      />
    );
    expect(hint).toContain('山田を選択中。入れ替える相手をタップ。もう一度タップで解除');

    const court = renderToStaticMarkup(
      <CourtManagement
        players={[
          player(1, 1),
          player(2, 2),
          player(3, 3),
          player(4, 4),
          player(5, 5),
          player(6, 6, 'rest', 'break'),
        ]}
        latestRound={round}
        memberMap={new Map([
          [1, member(1, '山田')],
          [2, member(2, '佐藤')],
          [3, member(3, '鈴木')],
          [4, member(4, '高橋')],
          [5, member(5, '伊藤')],
          [6, member(6, '渡辺')],
        ])}
        playerMap={
          new Map([
            [1, player(1, 1)],
            [2, player(2, 2)],
            [3, player(3, 3)],
            [4, player(4, 4)],
            [5, player(5, 5)],
            [6, player(6, 6, 'rest', 'break')],
          ])
        }
        matchCounts={new Map()}
        pairCounts={new Map()}
        substituting={null}
        onPlayerClick={async () => undefined}
        onSetAvailability={async () => undefined}
      />
    );
    expect(court).toContain('コート1');
    expect(court).not.toContain('COURT');
    expect(court).toContain('待機(このラウンド)');
    expect(court).toContain('次は休憩(1回)');
    expect(court).toContain('伊藤の休憩か早退を選ぶ');
    expect(court).toContain('タップで入れ替え');
    expect(court).not.toContain('>休憩中<');
  });

  test('開始ボタンは下のナビより手前に固定する', () => {
    const html = renderToStaticMarkup(
      <ParticipantSelection
        members={[
          member(1, '山田'),
          member(2, '佐藤'),
          member(3, '鈴木'),
          member(4, '高橋'),
        ]}
        courts={2}
        setCourts={() => undefined}
        selected={[1, 2, 3, 4]}
        onToggleSelect={() => undefined}
        onReorderSelected={() => undefined}
        onStart={() => undefined}
        onCreateMember={async () => undefined}
      />
    );
    expect(html).toContain('bottom-24');
    expect(html).toContain('z-overlay');
    expect(html).not.toContain('sticky');
    expect(html).toContain('選手を追加');
    expect(html).toContain('text-amber-800');
    expect(html).not.toContain('text-amber-600');
    expect(html).toContain('選手検索');
  });

  test('ヘルプはラウンドボタンと休憩・勝敗・取り消し・入れ替えを説明する', () => {
    const html = renderToStaticMarkup(
      <Dialog open>
        <HelpBody />
      </Dialog>
    );
    expect(html).toContain('「選手」タブ');
    expect(html).toContain('「ラウンド」ボタン');
    expect(html).not.toContain('「統計」ボタン');
    expect(html).toContain('入れ替える相手をタップ');
    expect(html).toContain('元に戻す');
    expect(html).toContain('早退');
    expect(html).toContain('勝ち');
    expect(html).toContain('掲示');
  });

  test('上書きと統合の説明を選ぶ前に出せる', () => {
    expect(OVERWRITE_SUMMARY).toContain('上書き');
    expect(OVERWRITE_SUMMARY).not.toContain('置き換え');
    expect(MERGE_SUMMARY).toContain('新しい選手と履歴を足します');
    expect(substitutionToast('山田', '佐藤')).toBe('山田と佐藤を入れ替えました');
  });

  test('練習画面は初回だけ止め、生成中はボタン文言にする', () => {
    const source = readFileSync('src/app/practice/page.tsx', 'utf8');
    expect(source).toContain('if (showBootSpinner)');
    expect(source).toContain('GENERATING_LABEL');
    expect(source).toContain('aria-pressed={courtDisplayMode === \'normal\'}');
    expect(source).toContain('role="status"');
    expect(source).not.toContain('isLoading || isInitialLoading');
  });

  test('ナビは名前と現在地を読み上げる', () => {
    const html = renderToStaticMarkup(<BottomNavigation />);
    expect(html).toContain('aria-label="メインメニュー"');
    expect(html).toContain('>選手<');
    expect(html).toContain('aria-current="page"');
    expect(html).not.toContain('>メンバー<');
  });
});
