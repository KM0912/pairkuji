import type { Member } from '@/types/member';
import { Users, AlertTriangle, Play } from 'lucide-react';
import { PiCourtBasketball } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { IconBadge } from '@/components/ui/IconBadge';
import { CourtSelector } from '@/components/ui/CourtSelector';
import { MemberRoster } from '@/components/members/MemberRoster';
import { TagSelector } from '@/components/practice/TagSelector';

interface ParticipantSelectionProps {
  members: Member[];
  courts: number;
  setCourts: (courts: number) => void;
  selected: number[];
  onToggleSelect: (id: number) => void;
  onReorderSelected: (orderedIds: number[]) => void;
  onStart: (e: React.FormEvent) => void;
  clubTags?: string[];
  onClubTagsChange?: (tags: string[]) => void;
  onMembersCreated: (ids: number[]) => void;
  isStarting?: boolean;
}

export function ParticipantSelection({
  members,
  courts,
  setCourts,
  selected,
  onToggleSelect,
  onReorderSelected,
  onStart,
  clubTags,
  onClubTagsChange,
  onMembersCreated,
  isStarting = false,
}: ParticipantSelectionProps) {
  const minToStart = 4;
  const runnableCourts = Math.min(courts, Math.floor(selected.length / 4));
  const needMore = Math.max(minToStart - selected.length, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconBadge icon={Users} size="md" className="text-primary" />
            メンバー・参加者
          </CardTitle>
          <CardDescription>
            {selected.length}名選択中 • 最低4名必要
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MemberRoster
            members={members}
            selection={{
              selected,
              onToggle: onToggleSelect,
              onReorder: onReorderSelected,
              onMembersCreated,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconBadge icon={PiCourtBasketball} className="text-primary" />
            コート設定
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-2">
            <CourtSelector courts={courts} setCourts={setCourts} />
            {runnableCourts < courts && selected.length >= 4 && (
              <p className="mt-2 rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-900">
                参加者数により実際は{runnableCourts}コートで開始されます
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {onClubTagsChange && (
        <TagSelector value={clubTags ?? []} onChange={onClubTagsChange} />
      )}

      <form onSubmit={onStart} className="sticky bottom-24">
        <Button
          type="submit"
          variant="default"
          size="lg"
          className="w-full font-bold shadow-2xl"
          disabled={selected.length < minToStart || isStarting}
        >
          {selected.length < minToStart ? (
            <span className="inline-flex items-center gap-3">
              <AlertTriangle className="size-6" />
              あと {needMore} 名選択してください
            </span>
          ) : (
            <span className="inline-flex items-center gap-3">
              <Play className="size-6" />
              {isStarting
                ? '開始中…'
                : `ダブルス練習開始 (${selected.length}名)`}
            </span>
          )}
        </Button>
      </form>
    </div>
  );
}
