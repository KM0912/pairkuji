'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Shuffle, UserCheck, Users, Zap, ChevronRight } from 'lucide-react';

type Status = 'loading' | 'lp' | 'redirect';

async function checkDatabaseExists(): Promise<boolean> {
  if (typeof indexedDB === 'undefined') return false;

  // indexedDB.databases() is supported in Chrome, Edge, Safari
  if ('databases' in indexedDB) {
    const dbs = await indexedDB.databases();
    return dbs.some((db) => db.name === 'pairkuji');
  }

  // Fallback: try opening and check if it was newly created
  return new Promise((resolve) => {
    let isNew = false;
    const req = indexedDB.open('pairkuji');
    req.onupgradeneeded = () => {
      // DB didn't exist — abort to avoid creating it
      isNew = true;
      req.transaction?.abort();
    };
    req.onsuccess = () => {
      req.result.close();
      resolve(!isNew);
    };
    req.onerror = () => {
      resolve(!isNew);
    };
  });
}

const features = [
  {
    icon: <Shuffle className="w-6 h-6" />,
    title: '公平な組み合わせ',
    description: '試合回数の偏りを最小化し、ペアや対戦の重複を自動回避',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: '柔軟な人数対応',
    description: '途中参加・休憩も自動調整。8〜24名に対応',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: '1秒で生成',
    description: 'ボタン1つで次のラウンドを即座に生成',
  },
  {
    icon: <UserCheck className="w-6 h-6" />,
    title: '登録・ログイン不要',
    description: 'アカウント作成なし。開いてすぐ使える',
  },
];

export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    checkDatabaseExists().then((exists) => {
      if (exists) {
        router.replace('/practice');
      } else {
        setStatus('lp');
      }
    });
  }, [router]);

  if (status === 'loading') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-modal bg-gradient-to-br from-background via-background to-primary/5 overflow-auto">
      <div className="min-h-screen flex flex-col">
        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-2xl scale-150" />
            <Image
              src="/icon-192.png"
              alt="ペアくじ"
              width={96}
              height={96}
              className="relative rounded-3xl shadow-level-3"
              priority
            />
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground tracking-tight text-center mb-3">
            ペアくじ
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground text-center max-w-sm leading-relaxed">
            ダブルス練習の組み合わせを
            <br />
            <span className="text-primary font-semibold">もっと公平に、もっと簡単に</span>
          </p>
        </div>

        {/* Features */}
        <div className="px-6 pb-8 max-w-lg mx-auto w-full">
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 border border-border/50 shadow-level-1"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-sm text-foreground mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-12 max-w-lg mx-auto w-full">
          <button
            onClick={() => router.push('/practice')}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-lg py-4 px-8 rounded-2xl shadow-level-3 active:scale-[0.98] transition-transform duration-fast"
          >
            はじめる
            <ChevronRight className="w-5 h-5" />
          </button>
          <p className="mt-4 text-xs text-muted-foreground text-center">
            インストール不要・無料で使えます
          </p>
        </div>
      </div>
    </div>
  );
}
