/**
 * アプリケーション全体で使用する共通の色設定
 */

// メインのグラデーション色設定
export const gradientColors = {
  primary: 'bg-gradient-to-r from-blue-400 to-emerald-400',
  primaryHover: 'hover:from-blue-500 hover:to-emerald-500',
  primaryDisabled: 'disabled:from-slate-400 disabled:to-slate-400',

  // その他のグラデーション
  secondary: 'bg-gradient-to-r from-slate-100 to-slate-200',
  secondaryHover: 'hover:from-slate-200 hover:to-slate-300',
  secondaryDisabled: 'disabled:from-slate-100 disabled:to-slate-100',

  danger: 'bg-gradient-to-r from-red-500 to-pink-500',
  dangerHover: 'hover:from-red-600 hover:to-pink-600',
  dangerDisabled: 'disabled:from-slate-400 disabled:to-slate-400',

  // チーム用のグラデーション
  teamA: 'bg-gradient-to-r from-sky-500 to-blue-600',
  teamB: 'bg-gradient-to-r from-emerald-500 to-teal-600',

  // 背景用の薄いグラデーション
  backgroundLight: 'bg-gradient-to-r from-blue-50 to-emerald-50',

  // アイコン用のグラデーション
  icon: 'bg-gradient-to-br from-emerald-500 to-blue-600',
} as const;

// テキスト色設定
export const textColors = {
  primary: 'text-white',
  secondary: 'text-slate-600',
  secondaryHover: 'hover:text-slate-800',
  muted: 'text-slate-400',
  dark: 'text-slate-800',
} as const;

// ボーダー色設定
export const borderColors = {
  primary: 'border-slate-200',
  secondary: 'border-slate-300',
  accent: 'border-blue-200',
} as const;

// 影の色設定
export const shadowColors = {
  danger: 'shadow-red-500/25',
} as const;

// よく使用される色の組み合わせ
export const colorCombinations = {
  primaryGradient: `${gradientColors.primary} ${textColors.primary}`,
  primaryGradientHover: `${gradientColors.primary} ${gradientColors.primaryHover} ${textColors.primary}`,
  primaryGradientDisabled: `${gradientColors.primary} ${gradientColors.primaryDisabled} ${textColors.primary}`,

  secondaryGradient: `${gradientColors.secondary} ${textColors.secondary} ${borderColors.secondary}`,
  secondaryGradientHover: `${gradientColors.secondary} ${gradientColors.secondaryHover} ${textColors.secondaryHover} ${borderColors.secondary}`,

  dangerGradient: `${gradientColors.danger} ${textColors.primary} ${shadowColors.danger}`,
  dangerGradientHover: `${gradientColors.danger} ${gradientColors.dangerHover} ${textColors.primary} ${shadowColors.danger}`,
  dangerGradientDisabled: `${gradientColors.danger} ${gradientColors.dangerDisabled} ${textColors.primary}`,

  backgroundLight: `${gradientColors.backgroundLight} ${borderColors.accent}`,
} as const;
