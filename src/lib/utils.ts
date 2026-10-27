import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Member } from "@/types/member"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDisplayName(
  memberMap: Map<number, Member>,
  id: number
): string {
  const member = memberMap.get(id);
  if (!member) return '???';
  if (!member.isDeleted) return member.name;
  const stripped = member.name.replace(/\s*#\d+$/, '').trim();
  if (stripped.startsWith('削除済みの選手')) return `削除済みの選手 ID ${id}`;
  return `(削除)${stripped} ID ${id}`;
}
