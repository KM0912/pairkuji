import { MessageCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { Button } from '../../ui/button';

export function FeedbackForm() {
  // Google FormsのURL（iframe埋め込み用）
  const googleFormUrl =
    'https://docs.google.com/forms/d/e/1FAIpQLSeOp4FoUV3Sw3WiU_LAfBUPN0uvpvf42AYWZGadDdOI0AnVeg/viewform?embedded=true';

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost">
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm hidden sm:inline">フィードバック</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0 bg-card rounded-2xl">
        <div className="border-b px-5 py-4">
          <DialogHeader className="items-start text-left">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-foreground" />
              <DialogTitle className="text-lg">フィードバック</DialogTitle>
            </div>
            <DialogDescription>
              ペアくじの不具合報告・改善要望フォームです。匿名で送信できます。
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-5 py-3 bg-secondary border-b">
          <p className="text-sm text-foreground">
            改善点やご要望があればお気軽にお送りください。
          </p>
        </div>

        <div className="h-[68vh]">
          <iframe
            src={googleFormUrl}
            width="100%"
            height="100%"
            title="フィードバックフォーム"
            className="w-full h-full border-0"
          >
            読み込み中...
          </iframe>
        </div>
      </DialogContent>
    </Dialog>
  );
}
