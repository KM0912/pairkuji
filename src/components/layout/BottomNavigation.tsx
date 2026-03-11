'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Zap, Users, BarChart3 } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    {
      id: 'members',
      label: 'メンバー',
      icon: <Users className="w-6 h-6" />,
      paths: ['/members'],
      href: '/members' as const,
    },
    {
      id: 'practice',
      label: 'ダブルス',
      icon: <Zap className="w-6 h-6" />,
      paths: ['/practice', '/'],
      href: '/practice' as const,
    },
    {
      id: 'stats',
      label: '統計',
      icon: <BarChart3 className="w-6 h-6" />,
      paths: ['/stats'],
      href: '/stats' as const,
    },
  ];

  const getActiveTab = () => {
    return tabs.find((tab) =>
      tab.paths.some(
        (path) =>
          pathname === path || (path !== '/' && pathname.startsWith(path))
      )
    );
  };

  const activeTab = getActiveTab();

  const handleTabClick = (tab: (typeof tabs)[0]) => {
    router.push(tab.href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border/50 shadow-level-2 safe-area-pb w-full z-sticky">
      <div className="flex px-2 max-w-2xl mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab?.id === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`flex-1 flex flex-col items-center justify-center py-3 px-3 min-h-[72px] transition-all duration-fast relative active:scale-[0.97] ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground active:text-foreground'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full" />
              )}
              <div
                className={`mb-1.5 transition-all duration-normal ease-out-expo ${
                  isActive
                    ? 'scale-110 text-primary'
                    : 'scale-100 hover:scale-105'
                }`}
              >
                {tab.icon}
              </div>
              <span
                className={`text-caption font-semibold transition-all duration-normal ${
                  isActive ? 'text-primary' : ''
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
