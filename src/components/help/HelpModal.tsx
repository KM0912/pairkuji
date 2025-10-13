import { X, Users, LayoutGrid, Shuffle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl max-h-[80vh] rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              🏸 ペアくじの使い方
            </h2>
            <p className="text-sm text-slate-500">
              バドミントンダブルス練習の組み合わせ管理アプリ
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={onClose}
            className="w-auto px-2 py-1 text-slate-400 hover:text-slate-600 shadow-none hover:shadow-none border-transparent"
            aria-label="閉じる"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="overflow-auto max-h-[60vh] px-5 py-4 space-y-6">
          <div className={'bg-slate-100 rounded-lg p-4'}>
            <h3 className="text-base font-semibold text-slate-800 mb-2">
              このアプリでできること
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              バドミントンダブルス練習で、参加者の試合回数や休憩回数のバランスを取りながら、
              公平な組み合わせを自動生成します。連続休憩や同じペアの重複を避けて、
              みんなが楽しめる練習環境を作ります。
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-semibold text-slate-800">使い方</h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-semibold text-slate-600">
                  1
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium text-slate-800">
                      メンバー登録
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    「メンバー」タブから練習に参加する可能性のある全員を登録します。
                    後からいつでも追加・編集できます。
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-semibold text-slate-600">
                  2
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <LayoutGrid className="w-4 h-4 text-sky-600" />
                    <span className="font-medium text-slate-800">練習設定</span>
                  </div>
                  <p className="text-sm text-slate-600">
                    「ダブルス」タブでコート数を設定し、その日の参加者を選択します。
                    最低4名から練習を開始できます。
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-semibold text-slate-600">
                  3
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shuffle className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-slate-800">
                      組み合わせ生成
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    「次の組み合わせを生成」ボタンで、公平性を考慮した組み合わせが自動作成されます。
                    選手をタップして入れ替えも可能です。
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-semibold text-slate-600">
                  4
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-slate-800">統計確認</span>
                  </div>
                  <p className="text-sm text-slate-600">
                    「統計」ボタンでペアの組み合わせ回数を確認できます。
                    未対戦ペアを優先して組み合わせが作られます。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <h3 className="text-sm font-semibold text-amber-800 mb-2">
              💡 ポイント
            </h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• 連続休憩を避けて全員が平等に試合できます</li>
              <li>• 同じペアの重複を最小限に抑えます</li>
              <li>• 途中で参加者を追加・変更することも可能です</li>
              <li>• フルスクリーン表示で参加者への案内もできます</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
