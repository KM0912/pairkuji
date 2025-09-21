import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { BottomNavigation } from '../components/BottomNavigation';
import { Header } from '../components/practice/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ペアくじ - ダブルス練習試合管理',
  description: 'ダブルス練習試合の組み合わせ管理PWA',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.className} overflow-x-hidden`}>
        <div className="min-h-screen bg-slate-50">
          <Header />
          <main className="pb-20">
            <div className="max-w-6xl mx-auto px-4 py-6">
              {children}
            </div>
          </main>
        </div>
        <BottomNavigation />
      </body>
    </html>
  );
}
