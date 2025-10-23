'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Settings, Zap, Users } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    {
      id: 'practice-settings',
      label: 'ダブルス設定',
      icon: <Settings className="w-6 h-6" />,
      paths: ['/practice/settings'],
      href: '/practice/settings',
    },
    {
      id: 'practice-matches',
      label: 'ダブルス試合',
      icon: <Zap className="w-6 h-6" />,
      paths: ['/', '/practice'],
      href: '/practice',
    },
    {
      id: 'members',
      label: 'メンバー',
      icon: <Users className="w-6 h-6" />,
      paths: ['/members', '/members/*'],
      href: '/members',
    },
  ];

  const matchesPath = (currentPath: string, targetPath: string) => {
    if (targetPath.endsWith('/*')) {
      const prefix = targetPath.slice(0, -2);
      return (
        currentPath === prefix || currentPath.startsWith(`${prefix}/`)
      );
    }
    return currentPath === targetPath;
  };

  const getActiveTab = () => {
    return tabs.find((tab) =>
      tab.paths.some((path) => matchesPath(pathname, path))
    );
  };

  const activeTab = getActiveTab();

  const handleTabClick = (tab: (typeof tabs)[0]) => {
    router.push(tab.href as any);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg safe-area-pb w-full">
      <div className="flex px-2 max-w-full">
        {tabs.map((tab) => {
          const isActive = activeTab?.id === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`flex-1 flex flex-col items-center justify-center py-4 px-3 min-h-[72px] transition-all duration-200 relative active:scale-95 ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground active:text-foreground'
              }`}
            >
              {isActive && (
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-1 bg-primary rounded-full" />
              )}
              <div
                className={`mb-2 transition-transform duration-200 ${
                  isActive ? 'scale-110' : ''
                }`}
              >
                {tab.icon}
              </div>
              <span className="text-xs font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
