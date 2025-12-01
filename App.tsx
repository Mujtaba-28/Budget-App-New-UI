
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Sparkles, LayoutGrid } from 'lucide-react';
import { Transaction, BudgetContext } from './types';
import { HomeView } from './components/views/HomeView';
import { StatsView } from './components/views/StatsView';
import { HistoryView } from './components/views/HistoryView';
import { AccountsView } from './components/views/AccountsView';
import { PlanView } from './components/views/PlanView';
import { Navigation } from './components/Navigation';
import { BudgetModal } from './components/modals/BudgetModal';
import { TransactionModal } from './components/modals/TransactionModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { SubscriptionsModal } from './components/modals/SubscriptionsModal';
import { GoalsModal } from './components/modals/GoalsModal';
import { DebtsModal } from './components/modals/DebtsModal';
import { AIChatModal } from './components/modals/AIChatModal';
import { TutorialModal } from './components/modals/TutorialModal';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { BudgetSelector } from './components/onboarding/BudgetSelector';
import { AppLock } from './components/security/AppLock';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useHashLocation } from './utils/router';
import { triggerHaptic } from './utils';

export default function App() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, budgets, updateBudget, dataError, isOnboarded, userName, activeContext, setActiveContext } = useFinance();
  const { isDark, currency } = useTheme();
  
  // Hash Router
  const [activeTab, navigate] = useHashLocation();
  
  // Local UI State
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [showContextPicker, setShowContextPicker] = useState(true);
  
  // Modal Visibility State
  const [showTxModal, setShowTxModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSubsModal, setShowSubsModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showDebtsModal, setShowDebtsModal] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Security State
  const [isLocked, setIsLocked] = useState(false);
  const [savedPin, setSavedPin] = useState<string | null>(null);

  // --- STORAGE HARDENING ---
  useEffect(() => {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then(persistent => {
        console.log(persistent ? 'Storage is persistent' : 'Storage is not persistent');
      });
    }
    const pin = localStorage.getItem('emerald_pin');
    if (pin) {
        setSavedPin(pin);
        setIsLocked(true);
    }
  }, []);

  useEffect(() => {
      if (isOnboarded && !showContextPicker) {
          const d = new Date();
          const mKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
          const bKey = `${activeContext}-${mKey}`;
          const defKey = `${activeContext}-default`;
          const budgetExists = budgets[bKey] || budgets[defKey];

          const timer = setTimeout(() => {
             // Logic to check if budget is missing, but making sure it doesn't nag incorrectly
          }, 800);
          return () => clearTimeout(timer);
      }
  }, [activeContext, budgets, isOnboarded, showContextPicker]);

  const currentMonthKey = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0');
  const budgetKey = `${activeContext}-${currentMonthKey}`;
  const defaultBudgetKey = `${activeContext}-default`;
  const totalBudget = budgets[budgetKey] || budgets[defaultBudgetKey] || 0;

  const changeMonth = (offset: number) => {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + offset);
      setCurrentDate(newDate);
  };

  const changeBudgetMonth = (offset: number) => {
      const newDate = new Date(currentDate); 
      newDate.setMonth(newDate.getMonth() + offset);
      setCurrentDate(newDate);
  };

  const handleSaveTransaction = async (txData: Transaction) => {
    if (editingTx) await updateTransaction(txData);
    else await addTransaction(txData);
    triggerHaptic(20);
    setShowTxModal(false); setEditingTx(null);
  };

  const handleDeleteTransaction = (id: number) => {
    deleteTransaction(id);
    triggerHaptic(50);
    setShowTxModal(false);
  };

  const handleUpdateBudget = (newAmount: number, monthKey: string, category?: string) => {
    updateBudget(newAmount, monthKey, category);
    triggerHaptic(20);
  };
  
  const handleContextSelect = (ctx: BudgetContext) => {
      setActiveContext(ctx);
      setShowContextPicker(false);
      triggerHaptic(10);
  };

  if (isLocked && savedPin) {
      return <div className={`${isDark ? 'dark' : ''}`}><AppLock savedPin={savedPin} onUnlock={() => setIsLocked(false)} /></div>;
  }

  if (dataError) {
      return (
          <div className="h-screen w-screen flex flex-col items-center justify-center bg-rose-50 text-rose-900 p-6 text-center">
              <h1 className="text-2xl font-bold mb-2">Data Error</h1>
              <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="bg-rose-600 text-white px-6 py-3 rounded-xl font-bold mt-4">Reset App</button>
          </div>
      )
  }

  if (!isOnboarded) {
      return (
          <div className={`${isDark ? 'dark' : ''}`}>
            <OnboardingWizard />
          </div>
      )
  }
  
  if (showContextPicker) {
      return (
          <div className={`${isDark ? 'dark' : ''}`}>
              <BudgetSelector onSelect={handleContextSelect} userName={userName} />
          </div>
      );
  }

  const renderContent = () => {
    switch(activeTab) {
      case 'home':
        return (
          <HomeView 
            currentDate={currentDate}
            changeMonth={changeMonth}
            onEditBudget={() => setShowBudgetModal(true)}
            onEditTx={(tx) => { setEditingTx(tx); setShowTxModal(true); }}
            onGoToStats={() => navigate('stats')}
            onViewHistory={() => navigate('history')}
            isPrivacyMode={isPrivacyMode}
          />
        );
      case 'stats':
        return (
          <StatsView 
            isPrivacyMode={isPrivacyMode}
            currentDate={currentDate}
            changeMonth={changeMonth}
          />
        );
      case 'history':
        return <HistoryView onEditTx={(tx) => { setEditingTx(tx); setShowTxModal(true); }} isPrivacyMode={isPrivacyMode} />;
      case 'plan':
          return (
              <PlanView 
                  onOpenSubscriptions={() => setShowSubsModal(true)}
                  onOpenGoals={() => setShowGoalsModal(true)}
                  onOpenDebts={() => setShowDebtsModal(true)}
                  onEditBudget={() => setShowBudgetModal(true)}
                  isPrivacyMode={isPrivacyMode}
              />
          );
      case 'profile':
      case 'accounts': 
        return <AccountsView onOpenSettings={() => setShowSettingsModal(true)} />;
      default:
        return null;
    }
  };

  return (
    <div className={`${isDark ? 'dark' : ''} transition-colors duration-200`}>
      <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col relative overflow-hidden text-slate-900 dark:text-slate-50 font-sans">
        
        {/* Subtle Background Mesh/Gradient - Reduced Opacity for cleaner look */}
        <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-emerald-50/40 to-transparent dark:from-emerald-900/5 pointer-events-none z-0"></div>

        {/* Premium Glass Header */}
        <div className="relative pt-safe-top px-4 py-3 flex justify-between items-center z-20 shrink-0 sticky top-0 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('profile')}>
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow-sm transition-transform group-active:scale-95">
                 <img src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${userName}`} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{userName}</h2>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-md self-start mt-0.5">Free</span>
              </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setShowContextPicker(true)} className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm border border-slate-200/50 dark:border-slate-700/50 transition-all active:scale-95">
                    <LayoutGrid size={18} strokeWidth={2} />
                </button>
                <button onClick={() => setShowAIChat(true)} className="w-9 h-9 flex items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 shadow-sm border border-indigo-100/50 dark:border-indigo-800/50 transition-all active:scale-95">
                    <Sparkles size={18} strokeWidth={2} fill="currentColor" className="opacity-30"/>
                </button>
                <button onClick={() => setIsPrivacyMode(!isPrivacyMode)} className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm border border-slate-200/50 dark:border-slate-700/50 transition-all active:scale-95">
                   {isPrivacyMode ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide z-10 w-full pb-20 relative">
            {renderContent()}
        </div>
        
        <Navigation 
            activeTab={activeTab === 'accounts' ? 'profile' : activeTab} 
            setActiveTab={(tab) => { triggerHaptic(5); navigate(tab); }} 
            onAddClick={() => { triggerHaptic(10); setEditingTx(null); setShowTxModal(true); }}
        />
        
        {/* Modals */}
        {showTxModal && <TransactionModal onClose={() => setShowTxModal(false)} onSave={handleSaveTransaction} onDelete={handleDeleteTransaction} initialData={editingTx} currency={currency} />}
        {showBudgetModal && <BudgetModal currentBudget={totalBudget} onSave={handleUpdateBudget} onClose={() => setShowBudgetModal(false)} currency={currency} currentDate={currentDate} changeBudgetMonth={changeBudgetMonth} />}
        {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} onOpenTutorial={() => { setShowSettingsModal(false); setShowTutorialModal(true); }} />}
        {showSubsModal && <SubscriptionsModal onClose={() => setShowSubsModal(false)} />}
        {showGoalsModal && <GoalsModal onClose={() => setShowGoalsModal(false)} />}
        {showDebtsModal && <DebtsModal onClose={() => setShowDebtsModal(false)} />}
        {showAIChat && <AIChatModal onClose={() => setShowAIChat(false)} totalBudget={totalBudget} />}
        {showTutorialModal && <TutorialModal onClose={() => setShowTutorialModal(false)} />}
      </div>
    </div>
  );
}
