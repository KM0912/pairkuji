import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { type PracticeSettings } from '@/types/practice';

interface HeaderProps {
  settings: PracticeSettings | null;
  onReset: () => void;
}

export function Header({ settings, onReset }: HeaderProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleResetClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmReset = () => {
    setShowConfirm(false);
    onReset();
  };

  const handleCancelReset = () => {
    setShowConfirm(false);
  };
  return (
    <div className="text-center mb-8 pt-6">
      <div className="relative inline-block">
        <h1 className="text-4xl font-bold text-slate-800 mb-2 relative">
          ペアくじ
          <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
        </h1>
      </div>
      <p className="text-slate-600 text-base mb-4">ダブルス練習管理</p>

      {settings && (
        <div className="mt-6">
          <button
            className="text-sm bg-gradient-to-r from-red-100 to-red-50 text-red-700 px-6 py-3 rounded-full hover:from-red-100 hover:to-pink-100 hover:text-red-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md border border-red-200 hover:border-red-300"
            onClick={handleResetClick}
          >
            練習をリセット
          </button>
        </div>
      )}

      {/* 確認モーダル */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  練習をリセットしますか？
                </h3>
                <p className="text-sm text-gray-600">
                  すべてのラウンドデータが削除され、元に戻すことはできません。
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelReset}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleConfirmReset}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                >
                  リセット
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
