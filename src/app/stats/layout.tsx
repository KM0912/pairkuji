import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '統計',
  description: 'ダブルス練習の統計情報を表示します。ペアの組み合わせや対戦相手の履歴を確認できます。',
  openGraph: {
    title: '統計 | ペアくじ',
    description: 'ダブルス練習の統計情報を表示します。ペアの組み合わせや対戦相手の履歴を確認できます。',
  },
  twitter: {
    title: '統計 | ペアくじ',
    description: 'ダブルス練習の統計情報を表示します。',
  },
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
