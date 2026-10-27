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
  // ファイルに無い選手へ付ける名前だけ、ファイル側の番号を外してこの端末のIDを出す。
  if (/^削除済みの選手 #\d+$/.test(member.name)) return `削除済みの選手 ID ${id}`;
  return `(削除)${member.name} ID ${id}`;
}
