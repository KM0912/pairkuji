# タイマー・カウントダウン機能実装

## 作業内容
リアルタイムタイマー、通知、バイブレーション機能の実装

## 実装ファイル
- `src/components/Countdown.tsx`
- `src/hooks/useTimer.ts`
- `src/lib/notifications.ts`

## 必要な機能
- カウントダウンタイマー表示
- 開始・停止・リセット制御
- 時間終了時の通知
- バイブレーション対応
- 音声アラート（オプション）

## useTimerフックの実装
```typescript
interface UseTimerReturn {
  remainingMs: number;
  isRunning: boolean;
  startTimer: (durationMs: number) => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  formatTime: (ms: number) => string;
}

export function useTimer(): UseTimerReturn {
  // setInterval + useEffect での実装
}
```

## Countdownコンポーネントの要件
- 大きく見やすい時間表示
- 残り時間の色分け（緑→黄→赤）
- プログレスバー表示
- 操作ボタン（開始/停止/リセット）

## 通知機能
```typescript
// notifications.ts
export const requestNotificationPermission = async (): Promise<boolean> => {};
export const showTimeUpNotification = (): void => {};
export const vibrate = (pattern: number[]): void => {};
```

## チェックリスト
- [ ] `src/hooks/useTimer.ts` 実装
- [ ] `src/components/Countdown.tsx` 実装
- [ ] `src/lib/notifications.ts` 実装
- [ ] 通知権限リクエスト実装
- [ ] バイブレーション機能実装
- [ ] 時間フォーマット関数実装
- [ ] タイマー状態の永続化
- [ ] セッションヘッダーへの統合