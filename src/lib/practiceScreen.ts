/** 全画面の読み込み表示は、練習画面を初めて開いたときだけ使う。 */
export function shouldBlockPracticeScreen(
  membersInitialLoad: boolean,
  practiceInitialLoad: boolean
): boolean {
  return !membersInitialLoad || !practiceInitialLoad;
}
