import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '選手管理',
  description: 'ダブルス練習の参加選手を管理します。選手の追加・編集・削除が可能です。',
  openGraph: {
    title: '選手管理 | ペアくじ',
    description: 'ダブルス練習の参加選手を管理します。選手の追加・編集・削除が可能です。',
  },
  twitter: {
    title: '選手管理 | ペアくじ',
    description: 'ダブルス練習の参加選手を管理します。',
  },
};

export default function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
