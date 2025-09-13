'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Play, Users } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    {
      id: 'practice',
      label: '練習',
      icon: <Play className="w-6 h-6" />,
      paths: ['/practice', '/'],
      href: '/practice'
    },
    {
      id: 'members',
      label: '選手管理',
      icon: <Users className="w-6 h-6" />,
      paths: ['/members'],
      href: '/members'
    },
  ];

  const getActiveTab = () => {
    return tabs.find(tab => tab.paths.some(path => pathname === path || (path !== '/' && pathname.startsWith(path))));
  };

  const activeTab = getActiveTab();

  const handleTabClick = (tab: typeof tabs[0]) => {
    router.push(tab.href as any);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex">
        {tabs.map((tab) => {
          const isActive = activeTab?.id === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`flex-1 flex flex-col items-center justify-center py-3 px-2 min-h-[64px] transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="mb-1">
                {tab.icon}
              </div>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};