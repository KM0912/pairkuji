'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';

export const BottomNavigation: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    {
      id: 'practice',
      label: '練習',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      paths: ['/practice', '/'],
      href: '/practice'
    },
    {
      id: 'members',
      label: '選手管理',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
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