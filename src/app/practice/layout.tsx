import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '練習管理',
  description: 'ダブルス練習の組み合わせを生成・管理します。公平性アルゴリズムにより、偏りのない試合組み合わせを自動生成します。',
  openGraph: {
    title: '練習管理 | ペアくじ',
    description: 'ダブルス練習の組み合わせを生成・管理します。公平性アルゴリズムにより、偏りのない試合組み合わせを自動生成します。',
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
