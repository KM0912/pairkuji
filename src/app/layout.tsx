import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import { Header } from '../components/practice/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ペアくじ - ダブルス練習試合管理',
  description: 'ダブルス練習試合の組み合わせ管理PWA',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaTrackingId = process.env.NEXT_PUBLIC_GA_TRACKING_ID;
  const isProd = process.env.NODE_ENV === 'production';

  return (
    <html lang="ja">
      <body className={`${inter.className} overflow-x-hidden`}>
        {isProd && gaTrackingId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaTrackingId}');
              `}
            </Script>
          </>
        )}
        <div className="min-h-screen bg-background">
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
