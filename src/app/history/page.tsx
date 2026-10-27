import { Suspense } from 'react';
import { Spinner } from '@/components/ui/spinner';
import HistoryBrowser from './HistoryBrowser';

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner className="size-8" />
        </div>
      }
    >
      <HistoryBrowser />
    </Suspense>
  );
}
