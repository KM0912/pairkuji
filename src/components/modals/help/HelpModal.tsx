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

export function HelpBody() {
  return (
    <>
        <div className="border-b py-4 pl-5 pr-16">
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
              バドミントンダブルス練習で、参加者の試合回数や待機のバランスを取りながら、
              公平な組み合わせを自動生成します。連続した待機や同じペアの重複を避けて、
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
                      選手登録
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    「選手」タブから練習に参加する可能性のある全員を登録します。
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
                    最低4人から練習を開始できます。
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
                    選手を1回タップしてから、入れ替える相手をタップします。ヒントの「解除」か、同じ選手をもう一度タップすると選択をやめます。入れ替えたあとは「元に戻す」が出ます。勝敗が付いたコートで別の人に入れ替えると、その勝敗は消えます。同じペアの2人を入れ替えたときは残します。
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
                      ラウンドの確認
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    狭い画面では数字のあとに「回」「面」「人」が付きます。たとえば「3回」「2面」「8/10人」です。広い画面では「ラウンド」ボタン、「コート」「参加者」と出ます。「回」または「ラウンド」ボタンで、この練習の履歴とペアの回数を確認できます。
                    各コートの「勝ち」をタップすると勝敗を記録できます。同じ側をもう一度タップすると記録を消せます。
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
                  5
                </div>
                <div>
                  <div className="mb-1 font-medium text-foreground">練習を終える</div>
                  <p className="text-sm text-muted-foreground">
                    右上のメニューから「練習終了」を選び、確認して終了します。ラウンドがある練習は履歴に保存されます。
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
                  6
                </div>
                <div>
                  <div className="mb-1 font-medium text-foreground">記録を見る</div>
                  <p className="text-sm text-muted-foreground">
                    下の「履歴」タブで過去の練習を開けます。下の「統計」タブでは勝率などを見られます。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <h3 className="text-sm font-semibold text-amber-800 mb-2">
              💡 ポイント
            </h3>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• 連続して待機が続かないようにし、全員が平等に試合できます。</li>
              <li>• 同じペアの重複を最小限に抑えます。</li>
              <li>• 途中で参加者を追加・変更することも可能です。</li>
              <li>
                • 選手を選ぶと、下の案内から休憩・早退を選べます。待機の人は名前の横から選べます。早退は確認してから実行します。参加者の管理からも同じ操作ができます。
              </li>
              <li>
                • 組み合わせを生成した直後は「元に戻す」が出ます。メニューの「直前のラウンドを元に戻す」でも取り消せます。勝敗が付いているときは確認してから取り消します。
              </li>
              <li>• 「掲示」で番号と名前を大きく表示できます。待機の人も出ます。</li>
              <li>• ヘッダーの「データ」ボタンから名簿と履歴を書き出せます。</li>
            </ul>
          </div>
        </div>
    </>
  );
}

export function HelpModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" aria-label="ヘルプ">
          <HelpCircle className="w-4 h-4" />
          <span className="text-sm hidden sm:inline">ヘルプ</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0 bg-card rounded-2xl">
        <HelpBody />
      </DialogContent>
    </Dialog>
  );
}
