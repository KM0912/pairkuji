import { X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackForm({ isOpen, onClose }: FeedbackFormProps) {
  if (!isOpen) return null;

  // Google FormsのURL（iframe埋め込み用）
  const googleFormUrl =
    'https://docs.google.com/forms/d/e/1FAIpQLSeOp4FoUV3Sw3WiU_LAfBUPN0uvpvf42AYWZGadDdOI0AnVeg/viewform?embedded=true';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl max-h-[80vh] rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">
              フィードバック
            </h2>
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

        <div className="px-5 py-3 bg-slate-50 border-b">
          <p className="text-sm text-slate-700 mb-2">
            ペアくじの不具合報告・改善要望フォームです。
            <strong>匿名で送信できます。</strong>
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
      </div>
    </div>
  );
}
