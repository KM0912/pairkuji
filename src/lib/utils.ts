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
  return member.isDeleted ? `(削除)${member.name}` : member.name;
}
