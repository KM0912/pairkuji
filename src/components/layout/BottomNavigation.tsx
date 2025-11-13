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
      href: '/members',
    },
    {
      id: 'practice',
      label: 'ダブルス',
      icon: <Zap className="w-6 h-6" />,
      paths: ['/practice', '/'],
      href: '/practice',
    },
    {
      id: 'stats',
      label: '統計',
      icon: <BarChart3 className="w-6 h-6" />,
      paths: ['/stats'],
      href: '/stats',
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
