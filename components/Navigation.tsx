
import React from 'react';
import { Home, PieChart, Compass, User, Plus } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface NavButtonProps {
    icon: LucideIcon;
    label: string;
    isActive: boolean;
    onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ icon: Icon, label, isActive, onClick }) => {
  return (
    <button 
        onClick={onClick}
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-all duration-200 group pt-1.5`}
    >
      <div className={`relative p-1 rounded-xl transition-all duration-200 ${isActive ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
        <Icon 
            size={22} 
            strokeWidth={isActive ? 2.5 : 2} 
            className="transition-colors duration-200"
        />
      </div>
      <span className={`text-[9px] font-bold transition-all duration-200 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
          {label}
      </span>
    </button>
  );
}

interface NavigationProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onAddClick: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, onAddClick }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 h-[60px] bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-t border-slate-200/60 dark:border-slate-800/60 flex items-start justify-around z-30 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.03)] dark:shadow-none">
            <NavButton icon={Home} label="Home" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
            <NavButton icon={PieChart} label="Stats" isActive={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
            
            <div className="relative -top-5 group">
                <div className="absolute inset-0 bg-slate-900 dark:bg-white rounded-full blur-md opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <button 
                    onClick={onAddClick} 
                    aria-label="Add Transaction" 
                    className="w-12 h-12 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl shadow-slate-900/30 dark:shadow-white/10 flex items-center justify-center transform active:scale-90 transition-transform duration-200 border-4 border-slate-50 dark:border-slate-950 relative z-10"
                >
                    <Plus size={24} strokeWidth={2.5} />
                </button>
            </div>
            
            <NavButton icon={Compass} label="Plan" isActive={activeTab === 'plan'} onClick={() => setActiveTab('plan')} />
            <NavButton icon={User} label="Profile" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        </div>
    );
}
