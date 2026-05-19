'use client';

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
}: {
  member: Member;
  order: number;
  onRemove: (id: number) => void;
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
      <span className="min-w-0 flex-1 truncate font-medium text-sm">
        {member.name}
      </span>
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
      {orderedMembers.length >= 2 && (
        <p className="text-xs text-muted-foreground px-1">
          ≡ をドラッグして番号を変更できます
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
