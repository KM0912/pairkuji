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

  // コンパクト（練習中）: スクロールに追従するヘッダー
  if (settings) {
    return (
      <>
        <div className="sticky top-0 z-40 -mx-4 -mt-6">
          <div className="bg-white border-b border-slate-200">
            <div className="h-16 flex items-center justify-between max-w-6xl mx-auto px-4">
              <div className="text-lg font-bold text-slate-800">🏸 ペアくじ</div>
              <button
                className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
                onClick={handleResetClick}
                aria-label="練習をリセット"
              >
                リセット
              </button>
            </div>
          </div>
        </div>

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
      </>
    );
  }

  // ランディング（未開始）: モバイル最適化ヘッダー
  return (
    <div className="text-center mb-8 pt-6 px-4">
      <div className="relative inline-block">
        <h1 className="text-4xl font-bold text-slate-800 mb-3 relative">
          🏸 ペアくじ
          <div className="absolute -bottom-3 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full shadow-sm"></div>
        </h1>
      </div>
      <p className="text-slate-600 text-base font-medium mt-2">ダブルス練習の組み合わせ管理</p>
      <p className="text-slate-400 text-sm mt-1">公平で楽しい練習をサポート</p>
    </div>
  );
}
