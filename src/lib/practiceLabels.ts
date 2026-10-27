/** 画面に出す用語。名簿の人は「選手」、その日に出る人は「参加者」。 */

export const WAITING_THIS_ROUND = '待機(このラウンド)';
export const NEXT_BREAK_ONCE = '次は休憩(1回)';
export const NEXT_EARLY = '次は早退';
export const GENERATING_LABEL = '生成中…';

export const OVERWRITE_SUMMARY =
  'この端末の名簿・履歴・進行中の練習を、ファイルの内容に上書きします。';
export const MERGE_SUMMARY =
  '同じ名前の選手は今の名簿を使い、新しい選手と履歴を足します。';

export function courtLabel(courtNo: number): string {
  return `コート${courtNo}`;
}

export function substitutionHint(name: string): string {
  return `${name}を選択中。入れ替える相手をタップ。もう一度タップで解除`;
}

export function substitutionToast(fromName: string, toName: string): string {
  return `${fromName}と${toName}を入れ替えました`;
}
