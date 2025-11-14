import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pairkuji.app';

export const metadata: Metadata = {
  title: '練習管理',
  description: 'ダブルス練習の組み合わせを生成・管理します。公平性アルゴリズムにより、偏りのない試合組み合わせを自動生成します。',
  alternates: {
    canonical: `${baseUrl}/practice`,
  },
  openGraph: {
    title: '練習管理 | ペアくじ',
    description: 'ダブルス練習の組み合わせを生成・管理します。公平性アルゴリズムにより、偏りのない試合組み合わせを自動生成します。',
    url: `${baseUrl}/practice`,
  },
  twitter: {
    title: '練習管理 | ペアくじ',
    description: 'ダブルス練習の組み合わせを生成・管理します。',
  },
};

export default function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
