
import React, { useState, useMemo, useEffect } from 'react';
import * as Lucide from 'lucide-react';
const { ChevronLeft, ChevronRight, Calendar: CalendarIcon, Edit2, Wallet, Target, ArrowDownLeft, ArrowUpRight, ShieldAlert, Zap, Plus, Camera, PieChart } = Lucide;
import { Transaction } from '../../types';
import { TransactionItem } from '../TransactionItem';
import { formatMoney, triggerHaptic, calculateNextDate, formatDate } from '../../utils';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';

interface HomeViewProps {
  currentDate: Date;
  changeMonth: (offset: number) => void;
  onEditBudget: () => void;
  onEditTx: (tx: Transaction) => void;
  onGoToStats: () => void;
  onViewHistory: () => void;
  isPrivacyMode: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({ 
  currentDate, changeMonth, onEditBudget, onEditTx, 
  onGoToStats, onViewHistory, isPrivacyMode 
}) => {
    const { transactions, lastBackupDate, subscriptions, updateSubscription, addTransaction, activeContext, customContexts, budgets, createBackup } = useFinance();
    const { currency } = useTheme();
    const [showBackupAlert, setShowBackupAlert] = useState(false);

    // Calculate Total Budget
    const currentMonthKey = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0');
    const budgetKey = `${activeContext}-${currentMonthKey}`;
    const defaultBudgetKey = `${activeContext}-default`;
    const totalBudget = budgets[budgetKey] || budgets[defaultBudgetKey] || 0;
    
    // Resolve Context Name
    const activeContextName = useMemo(() => {
        const found = customContexts.find(c => c.id === activeContext);
        return found ? found.name : 'Budget';
    }, [activeContext, customContexts]);

    // Backup Health Check
    useEffect(() => {
        if (transactions.length > 5) {
            if (!lastBackupDate) setShowBackupAlert(true);
            else {
                const diff = new Date().getTime() - new Date(lastBackupDate).getTime();
                if (diff / (1000 * 3600 * 24) > 7) setShowBackupAlert(true);
            }
        }
    }, [transactions.length, lastBackupDate]);
    
    // Check for Due Subscriptions
    const dueSubscription = useMemo(() => {
        const today = new Date();
        today.setHours(0,0,0,0);
        const due = subscriptions.filter(sub => {
            const nextDate = new Date(sub.nextBillingDate);
            nextDate.setHours(0,0,0,0);
            const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return diffDays <= 1;
        }).sort((a,b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime());
        return due.length > 0 ? due[0] : null;
    }, [subscriptions]);

    const handlePaySubscription = async () => {
        if (!dueSubscription) return;
        await addTransaction({
            id: Date.now(),
            title: dueSubscription.name,
            amount: dueSubscription.amount,
            category: dueSubscription.category || 'Bills',
            date: new Date().toISOString(),
            type: 'expense'
        });
        const newNextDate = calculateNextDate(dueSubscription.nextBillingDate, dueSubscription.billingCycle);
        updateSubscription({ ...dueSubscription, nextBillingDate: newNextDate });
        triggerHaptic(20);
    };

    // Derived Calculations
    const monthlyTransactions = useMemo(() => {
        return transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === currentDate.getMonth() && tDate.getFullYear() === currentDate.getFullYear();
        });
    }, [transactions, currentDate]);

    const totalIncome = monthlyTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = monthlyTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    const remainingBudget = totalBudget - totalExpense;
    const budgetProgress = totalBudget > 0 ? Math.min((totalExpense / totalBudget) * 100, 100) : (totalExpense > 0 ? 100 : 0);

    // GROUP TRANSACTIONS BY DATE
    const groupedTransactions = useMemo(() => {
        const groups: Record<string, Transaction[]> = {};
        const sorted = [...monthlyTransactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        sorted.forEach(tx => {
            const dateLabel = formatDate(tx.date); 
            if (!groups[dateLabel]) groups[dateLabel] = [];
            groups[dateLabel].push(tx);
        });
        return groups;
    }, [monthlyTransactions]);

    const currentMonthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-6 max-w-md mx-auto">
            
            {/* MONTH NAVIGATOR */}
            <div className="flex items-center justify-between px-1">
                <button onClick={() => changeMonth(-1)} className="p-2.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 text-slate-500 hover:scale-105 transition-transform"><ChevronLeft size={18}/></button>
                <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-md px-5 py-2.5 rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                    <CalendarIcon size={14} className="text-slate-400"/>
                    <span>{currentMonthName}</span>
                </div>
                <button onClick={() => changeMonth(1)} className="p-2.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 text-slate-500 hover:scale-105 transition-transform"><ChevronRight size={18}/></button>
            </div>

            {/* ALERTS */}
            {showBackupAlert && (
                <div className="mx-1 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <ShieldAlert size={18} className="text-amber-600 dark:text-amber-500"/>
                        <span className="text-xs font-bold text-amber-800 dark:text-amber-200">Data Backup Required</span>
                    </div>
                    <button onClick={() => { createBackup(); setShowBackupAlert(false); }} className="px-3 py-1 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-[10px] font-bold text-amber-800 dark:text-amber-200">Backup</button>
                </div>
            )}
            
            {dueSubscription && (
                <div className="mx-1 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-2">
                     <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                             <Zap size={16} fill="currentColor"/>
                         </div>
                         <div>
                             <p className="text-xs font-bold text-indigo-900 dark:text-indigo-100">{dueSubscription.name} Due</p>
                             <p className="text-[10px] text-indigo-700 dark:text-indigo-300">{formatMoney(dueSubscription.amount, currency, isPrivacyMode)}</p>
                         </div>
                     </div>
                     <button onClick={handlePaySubscription} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold shadow-sm active:scale-95 transition-transform">Pay Now</button>
                </div>
            )}

            {/* HERO BUDGET CARD */}
            <div className="relative group mx-1">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-black dark:from-slate-950 dark:to-black rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none transition-transform duration-500"></div>
                
                {/* Mesh Gradient Effect - Subtle */}
                <div className="absolute top-0 right-0 w-full h-full opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500 via-teal-600 to-transparent rounded-3xl blur-2xl"></div>

                <div className="relative p-6 text-white rounded-3xl overflow-hidden border border-white/10 backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                             <div className="flex items-center gap-2 mb-2">
                                 <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded text-white/80 uppercase tracking-wide backdrop-blur-md">{activeContextName}</span>
                             </div>
                             <h2 className="text-4xl font-bold tracking-tight text-white drop-shadow-sm">{formatMoney(remainingBudget, currency, isPrivacyMode)}</h2>
                             <p className="text-xs text-white/60 mt-1 font-medium">Available Balance</p>
                        </div>
                        <button onClick={onEditBudget} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors active:scale-95">
                            <Wallet size={18} className="text-emerald-300"/>
                        </button>
                    </div>

                    {/* Progress */}
                    <div className="mb-6">
                        <div className="flex justify-between text-[10px] font-semibold text-white/70 mb-2">
                            <span>{Math.round(budgetProgress)}% Used</span>
                            <span>{formatMoney(totalBudget, currency, isPrivacyMode)} Limit</span>
                        </div>
                        <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                            <div 
                                className={`h-full rounded-full transition-all duration-700 ease-out relative ${budgetProgress > 100 ? 'bg-gradient-to-r from-rose-500 to-red-600' : 'bg-gradient-to-r from-emerald-400 to-teal-400'}`} 
                                style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                            >
                            </div>
                        </div>
                    </div>

                    {/* Compact Cash Flow Strip - Replacing Giant Bento Boxes */}
                    <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                         <div className="flex items-center gap-2">
                             <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center"><ArrowDownLeft size={12} className="text-emerald-300"/></div>
                             <div>
                                 <p className="text-[10px] font-bold text-white/50 uppercase">Income</p>
                                 <p className="text-sm font-bold text-white">{formatMoney(totalIncome, currency, isPrivacyMode)}</p>
                             </div>
                         </div>
                         <div className="w-px h-8 bg-white/10"></div>
                         <div className="flex items-center gap-2">
                             <div className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center"><ArrowUpRight size={12} className="text-rose-300"/></div>
                             <div>
                                 <p className="text-[10px] font-bold text-white/50 uppercase">Expense</p>
                                 <p className="text-sm font-bold text-white">{formatMoney(totalExpense, currency, isPrivacyMode)}</p>
                             </div>
                         </div>
                    </div>
                </div>
            </div>

            {/* QUICK ACTION ROW - Replaces buttons inside card */}
            <div className="flex gap-3 px-1 overflow-x-auto scrollbar-hide py-2">
                <button onClick={() => onEditTx({} as any)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm text-xs font-bold active:scale-95 transition-transform whitespace-nowrap">
                    <Plus size={16}/> New Transaction
                </button>
                <button onClick={() => onGoToStats()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white shadow-sm text-xs font-bold active:scale-95 transition-transform whitespace-nowrap">
                    <PieChart size={16}/> Analytics
                </button>
            </div>

            {/* TRANSACTIONS LIST */}
            <div className="pt-2 pb-6">
                <div className="flex justify-between items-center mb-4 px-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Recent Activity</h3>
                    <button onClick={onViewHistory} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg">
                        See All
                    </button>
                </div>
                
                <div className="space-y-6">
                    {Object.keys(groupedTransactions).length > 0 ? (
                        Object.entries(groupedTransactions).slice(0, 3).map(([dateLabel, txs]) => (
                            <div key={dateLabel} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="sticky top-0 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-xl py-2 z-10 px-2 -mx-2 border-b border-slate-100/50 dark:border-slate-800/50 mb-2">
                                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{dateLabel}</h4>
                                </div>
                                <div className="space-y-2">
                                    {(txs as Transaction[]).map(tx => (
                                        <TransactionItem 
                                            key={tx.id} 
                                            tx={tx} 
                                            onClick={onEditTx} 
                                            currency={currency}
                                            isPrivacyMode={isPrivacyMode}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 mx-1">
                            <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 text-slate-300">
                                <Target size={28}/>
                            </div>
                            <p className="text-sm font-bold text-slate-500">No transactions this month</p>
                            <button onClick={() => onEditTx({} as any)} className="mt-3 text-xs font-bold text-indigo-600 hover:underline">Add First Transaction</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
