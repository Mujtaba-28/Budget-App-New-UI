
import React, { useMemo } from 'react';
import * as Lucide from 'lucide-react';
const { Target, TrendingDown, Repeat, ChevronRight, PieChart, ShieldCheck } = Lucide;

import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { formatMoney } from '../../utils';
import { EXPENSE_CATEGORIES } from '../../constants';

interface PlanViewProps {
  onOpenSubscriptions: () => void;
  onOpenGoals: () => void;
  onOpenDebts: () => void;
  isPrivacyMode: boolean;
  onEditBudget: () => void;
}

export const PlanView: React.FC<PlanViewProps> = ({ onOpenSubscriptions, onOpenGoals, onOpenDebts, isPrivacyMode, onEditBudget }) => {
    const { subscriptions, goals, debts, budgets, activeContext } = useFinance();
    const { currency } = useTheme();

    const currentDate = new Date();
    const monthKey = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0');
    const totalBudgetKey = `${activeContext}-${monthKey}`;
    const defaultBudgetKey = `${activeContext}-default`;
    const totalBudget = budgets[totalBudgetKey] || budgets[defaultBudgetKey] || 0;

    const categoryBudgets = useMemo(() => {
        return EXPENSE_CATEGORIES.map(cat => {
            const catKey = `${activeContext}-${monthKey}-category-${cat.name}`;
            const limit = budgets[catKey] || 0;
            return { ...cat, limit };
        }).filter(c => c.limit > 0).sort((a,b) => b.limit - a.limit);
    }, [budgets, activeContext, monthKey]);

    const calculateMonthlyCost = (amount: number, cycle: string) => {
        switch(cycle) {
            case 'daily': return amount * 30;
            case 'weekly': return amount * 4.33; 
            case 'monthly': return amount;
            case 'quarterly': return amount / 3;
            case 'half-yearly': return amount / 6;
            case 'yearly': return amount / 12;
            default: return amount;
        }
    };
    const totalMonthlySubs = subscriptions.reduce((acc, sub) => acc + calculateMonthlyCost(sub.amount, sub.billingCycle), 0);
    const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
    const totalDebt = debts.reduce((acc, d) => acc + d.currentBalance, 0);

    const PlanCard = ({ title, value, icon: Icon, colorClass, gradientClass, onClick, subText }: any) => (
        <button 
            onClick={onClick}
            className="w-full bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group active:scale-[0.99] transition-all hover:border-slate-300 dark:hover:border-slate-700 relative overflow-hidden"
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${gradientClass}`}></div>
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClass} shadow-sm`}>
                    <Icon size={22} strokeWidth={2} />
                </div>
                <div className="text-left">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">{title}</h3>
                    <div className="flex items-baseline gap-2">
                        <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
                        {subText && <p className="text-xs font-medium text-slate-400">{subText}</p>}
                    </div>
                </div>
            </div>
            <div className="p-2 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors">
                <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"/>
            </div>
        </button>
    );

    return (
        <div className="space-y-4 max-w-md mx-auto pt-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white px-2 mb-4">Financial Plan</h2>
            
            <div className="space-y-3 mx-1">
                <PlanCard 
                    title="Budget"
                    value={formatMoney(totalBudget, currency, isPrivacyMode)}
                    icon={PieChart}
                    colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                    gradientClass="bg-emerald-500"
                    onClick={onEditBudget}
                    subText={categoryBudgets.length > 0 ? `${categoryBudgets.length} Limits` : ''}
                />

                <PlanCard 
                    title="Subscriptions"
                    value={formatMoney(totalMonthlySubs, currency, isPrivacyMode)}
                    icon={Repeat}
                    colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                    gradientClass="bg-indigo-500"
                    onClick={onOpenSubscriptions}
                    subText="/ mo"
                />

                <PlanCard 
                    title="Goals"
                    value={formatMoney(totalSaved, currency, isPrivacyMode)}
                    icon={Target}
                    colorClass="bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400"
                    gradientClass="bg-sky-500"
                    onClick={onOpenGoals}
                />

                <PlanCard 
                    title="Liabilities"
                    value={formatMoney(totalDebt, currency, isPrivacyMode)}
                    icon={TrendingDown}
                    colorClass="bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
                    gradientClass="bg-rose-500"
                    onClick={onOpenDebts}
                />
            </div>

            {/* Spending Limits Preview */}
            {categoryBudgets.length > 0 && (
                <div className="mt-8 pt-4 px-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Category Limits</h3>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        {categoryBudgets.slice(0, 5).map((cat, i) => (
                            <div key={cat.id} className={`flex justify-between items-center p-4 text-sm ${i !== 0 ? 'border-t border-slate-100 dark:border-slate-800' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full ring-2 ring-slate-50 dark:ring-slate-800" style={{ backgroundColor: cat.code }}></div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{cat.name}</span>
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white tabular-nums">{formatMoney(cat.limit, currency, isPrivacyMode)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
