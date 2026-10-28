'use client';

import { useEffect, useRef, useState } from 'react';
import { type Member } from '@/types/member';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { PlayerNumber } from '../ui/PlayerNumber';
import { cn } from '@/lib/utils';
import { SampleBadge } from '@/components/members/SampleBadge';

interface SelectedParticipantsSortableListProps {
  members: Member[];
  selected: number[];
  onReorder: (orderedIds: number[]) => void;
  onRemove: (id: number) => void;
}

function SortableParticipantRow({
  member,
  order,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  member: Member;
  order: number;
  onRemove: (id: number) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const memberId = member.id!;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: memberId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-lg border bg-card px-2 py-2 shadow-level-1 border-border',
        isDragging && 'z-10 opacity-90 shadow-level-3 ring-2 ring-primary/30'
      )}
    >
      <button
        type="button"
        className="flex shrink-0 touch-none items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 min-h-[44px] min-w-[44px]"
        aria-label={`${member.name}の番号${order}をドラッグして並べ替え`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" aria-hidden />
      </button>
      <PlayerNumber number={order} variant="neutral" size="sm" />
      <span className="flex min-w-0 flex-1 items-center gap-1 font-medium text-sm">
        <span className="truncate">{member.name}</span>
        {member.isSample && <SampleBadge />}
      </span>
      <div className="flex shrink-0 flex-col">
        <button
          type="button"
          id={`move-up-${memberId}`}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-sm font-semibold disabled:opacity-30"
          aria-label={`${member.name}を一つ上へ`}
          disabled={isFirst}
          onClick={onMoveUp}
        >
          ↑
        </button>
        <button
          type="button"
          id={`move-down-${memberId}`}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-sm font-semibold disabled:opacity-30"
          aria-label={`${member.name}を一つ下へ`}
          disabled={isLast}
          onClick={onMoveDown}
        >
          ↓
        </button>
      </div>
      <button
        type="button"
        className="flex shrink-0 items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 min-h-[44px] min-w-[44px]"
        aria-label={`${member.name}を選択から外す`}
        onClick={() => onRemove(memberId)}
      >
        <X className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}

export function SelectedParticipantsSortableList({
  members,
  selected,
  onReorder,
  onRemove,
}: SelectedParticipantsSortableListProps) {
  const memberMap = new Map(members.map((m) => [m.id!, m]));

  const orderedMembers = selected
    .map((id) => memberMap.get(id))
    .filter((m): m is Member => m != null);

  const [moveNotice, setMoveNotice] = useState('');
  const focusTarget = useRef<string | null>(null);

  useEffect(() => {
    if (!focusTarget.current) return;
    const id = focusTarget.current;
    focusTarget.current = null;
    document.getElementById(id)?.focus();
  }, [selected]);

  const moveTo = (index: number, delta: number) => {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= selected.length) return;
    const member = orderedMembers[index];
    if (!member?.id) return;
    onReorder(arrayMove(selected, index, nextIndex));
    setMoveNotice(`${member.name}を${nextIndex + 1}番目に移動しました`);
    const direction = delta < 0 ? 'up' : 'down';
    const atEdge =
      (direction === 'up' && nextIndex === 0) ||
      (direction === 'down' && nextIndex === selected.length - 1);
    const focusDirection = atEdge ? (direction === 'up' ? 'down' : 'up') : direction;
    focusTarget.current = `move-${focusDirection}-${member.id}`;
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selected.indexOf(Number(active.id));
    const newIndex = selected.indexOf(Number(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(arrayMove(selected, oldIndex, newIndex));
  };

  if (orderedMembers.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-caption">
        まだ参加者が選択されていません
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="sr-only" role="status" aria-live="polite">
        {moveNotice}
      </div>
      {orderedMembers.length >= 2 && (
        <p className="text-xs text-muted-foreground px-1">
          ↑↓ またはドラッグで番号を変更できます
        </p>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={selected}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-2" role="list">
            {orderedMembers.map((member, index) => (
              <li key={member.id}>
                <SortableParticipantRow
                  member={member}
                  order={index + 1}
                  isFirst={index === 0}
                  isLast={index === orderedMembers.length - 1}
                  onMoveUp={() => moveTo(index, -1)}
                  onMoveDown={() => moveTo(index, 1)}
                  onRemove={onRemove}
                />
              </li>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
