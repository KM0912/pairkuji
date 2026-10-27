'use client';

import { useParams } from 'next/navigation';
import { SessionDetailView } from '@/components/history/SessionDetailView';

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = Number(params.id);
  return <SessionDetailView sessionId={sessionId} />;
}
