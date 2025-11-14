import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pairkuji.app';

export const metadata: Metadata = {
  title: '統計',
  description: 'ダブルス練習の統計情報を表示します。ペアの組み合わせや対戦相手の履歴を確認できます。',
  alternates: {
    canonical: `${baseUrl}/stats`,
  },
  openGraph: {
    title: '統計 | ペアくじ',
    description: 'ダブルス練習の統計情報を表示します。ペアの組み合わせや対戦相手の履歴を確認できます。',
    url: `${baseUrl}/stats`,
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
