import { Users, Shuffle, BarChart3, HelpCircle } from 'lucide-react';
import { PiCourtBasketball } from 'react-icons/pi';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { Button } from '../../ui/button';

export function HelpModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost">
          <HelpCircle className="w-4 h-4" />
          <span className="text-sm hidden sm:inline">ヘルプ</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0 bg-card rounded-2xl">
        <div className="border-b px-5 py-4">
          <DialogHeader className="items-start text-left">
            <DialogTitle className="text-lg">🏸 ペアくじの使い方</DialogTitle>
            <DialogDescription>
              バドミントンダブルス練習の組み合わせ管理アプリ
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="overflow-auto max-h-[60vh] px-5 py-4 space-y-6">
          <div className={'bg-muted rounded-lg p-4'}>
            <h3 className="text-base font-semibold text-foreground mb-2">
              このアプリでできること
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              バドミントンダブルス練習で、参加者の試合回数や休憩回数のバランスを取りながら、
              公平な組み合わせを自動生成します。連続休憩や同じペアの重複を避けて、
              みんなが楽しめる練習環境を作ります。
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">使い方</h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
                  1
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">
                      メンバー登録
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    「メンバー」タブから練習に参加する可能性のある全員を登録します。
                    後からいつでも追加・編集できます。
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
                  2
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <PiCourtBasketball className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">
                      練習設定
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    「ダブルス」タブでコート数を設定し、その日の参加者を選択します。
                    最低4名から練習を開始できます。
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
                  3
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shuffle className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">
                      組み合わせ生成
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    「次の組み合わせを生成」ボタンで、公平性を考慮した組み合わせが自動作成されます。
                    選手をタップして入れ替えも可能です。
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
                  4
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">
                      統計確認
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
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
      </DialogContent>
    </Dialog>
  );
}
