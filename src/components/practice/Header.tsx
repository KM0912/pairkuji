import { type PracticeSettings } from '@/types/practice';

interface HeaderProps {
  settings: PracticeSettings | null;
  onReset: () => void;
}

export function Header({ settings, onReset }: HeaderProps) {
  return (
    <div className="text-center mb-8 pt-6">
      <div className="relative inline-block">
        <h1 className="text-4xl font-bold text-slate-800 mb-2 relative">
          ペアくじ
          <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"></div>
        </h1>
      </div>
      <p className="text-slate-600 text-base mb-4">ダブルス練習管理</p>

      {settings && (
        <div className="mt-6">
          <button
            className="text-sm bg-gradient-to-r from-red-100 to-red-50 text-red-700 px-6 py-3 rounded-full hover:from-red-100 hover:to-pink-100 hover:text-red-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md border border-red-200 hover:border-red-300"
            onClick={onReset}
          >
            練習をリセット
          </button>
        </div>
      )}
    </div>
  );
}
