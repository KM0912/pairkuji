import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import { Header } from '../components/layout/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://pairkuji.app'
  ),
  title: {
    default: 'ペアくじ - ダブルス練習試合管理',
    template: '%s | ペアくじ',
  },
  description:
    'ダブルス練習試合の組み合わせを公平に管理するPWAアプリ。試合回数の偏りを最小化し、重複するペアや対戦を避けた最適な組み合わせを自動生成します。',
  keywords: [
    'ダブルス',
    '練習試合',
    '組み合わせ',
    'ペア',
    'バドミントン',
    'テニス',
    '卓球',
    'PWA',
    'オフライン対応',
    '公平性',
    'アルゴリズム',
  ],
  authors: [{ name: 'pairkuji' }],
  creator: 'pairkuji',
  publisher: 'pairkuji',
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: '/',
    siteName: 'ペアくじ',
    title: 'ペアくじ - ダブルス練習試合管理',
    description:
      'ダブルス練習試合の組み合わせを公平に管理するPWAアプリ。試合回数の偏りを最小化し、重複するペアや対戦を避けた最適な組み合わせを自動生成します。',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'ペアくじアイコン',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'ペアくじ - ダブルス練習試合管理',
    description: 'ダブルス練習試合の組み合わせを公平に管理するPWAアプリ',
    images: ['/icon-512.png'],
  },
  themeColor: '#1e293b',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ペアくじ',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaTrackingId = process.env.NEXT_PUBLIC_GA_TRACKING_ID;
  const isProd = process.env.NODE_ENV === 'production';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pairkuji.app';

  // 構造化データ（JSON-LD）
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ペアくじ',
    alternateName: 'pairkuji',
    description:
      'ダブルス練習試合の組み合わせを公平に管理するPWAアプリ。試合回数の偏りを最小化し、重複するペアや対戦を避けた最適な組み合わせを自動生成します。',
    url: baseUrl,
    applicationCategory: 'SportsApplication',
    operatingSystem: 'Web Browser, iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'JPY',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1',
    },
    inLanguage: 'ja',
    installUrl: baseUrl,
    screenshot: `${baseUrl}/icon-512.png`,
    softwareVersion: '1.0.0',
    author: {
      '@type': 'Organization',
      name: 'pairkuji',
    },
  };

  return (
    <html lang="ja">
      <body className={`${inter.className} overflow-x-hidden`}>
        {/* 構造化データ */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

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
            <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>
          </main>
        </div>
        <BottomNavigation />
      </body>
    </html>
  );
}
