import { TabFilter } from '../types';

const tabs: TabFilter[] = ['All', 'Head', 'Admin', 'Staff', 'User', 'Suspended'];

interface UserTabsProps {
  activeTab: TabFilter;
  tabCount: (tab: TabFilter) => number;
  onTabChange: (tab: TabFilter) => void;
}

export default function UserTabs({ activeTab, tabCount, onTabChange }: UserTabsProps) {
  return (
    <div className="flex items-center border-b border-neutral-200 px-6 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`flex items-center gap-2 px-5 py-4 text-base font-medium whitespace-nowrap border-b-2 transition-colors ${
            activeTab === tab
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          {tab.toUpperCase()}
          <span
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
              activeTab === tab
                ? 'bg-teal-500 text-white'
                : 'bg-neutral-100 text-neutral-500'
            }`}
          >
            {tabCount(tab)}
          </span>
        </button>
      ))}
    </div>
  );
}